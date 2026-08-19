using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;
using Ugnay.Api.Auth;
using Ugnay.Api.Configuration;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Domain.Authorization;
using Ugnay.Domain.Registrations;
using Ugnay.Domain.Residents;

namespace Ugnay.Api.Endpoints;

// --- DTOs -------------------------------------------------------------------

public record RegistrationSummaryDto(
    Guid Id, string ReferenceNumber, string FullName, string Barangay,
    string Status, DateTimeOffset CreatedAtUtc);

public record ResidentMatchDto(
    Guid Id, string ReferenceNumber, string FullName, DateOnly? BirthDate, string VerificationStatus);

public record RegistrationDetailDto(
    Guid Id, string ReferenceNumber, string FirstName, string? MiddleName, string LastName,
    string? Suffix, string Sex, DateOnly? BirthDate, string? ContactEmail, string? ContactPhone,
    string? Address, string Barangay, string Status, string? ReviewRemarks,
    Guid? ResultResidentId, IReadOnlyList<ResidentMatchDto> Matches);

public record ApproveRegistrationRequest(Guid? ResidentId, string? Remarks);

public record RejectRegistrationRequest(string? Remarks);

/// <summary>
/// Staff review of self-service registrations (spec §12). Reads require
/// <c>registration.view</c>; approve/reject require <c>registration.process</c>,
/// are CSRF-protected, and are constrained to the caller's organization scope.
/// Approval matches to an existing resident or creates a new one — registration
/// alone is never treated as residency.
/// </summary>
public static class RegistrationEndpoints
{
    public static IEndpointRouteBuilder MapRegistrationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/registrations").WithTags("Registrations");

        // GET /api/registrations?status=Submitted
        group.MapGet("/", async (
            string? status, ScopeResolver scope, IAppDbContext db, CancellationToken ct) =>
        {
            var visible = await scope.VisibleOrganizationIdsAsync(ct);
            if (visible.Count == 0) return Results.Ok(Array.Empty<RegistrationSummaryDto>());

            var query = db.ResidentRegistrations.AsNoTracking()
                .Where(r => visible.Contains(r.OrganizationId));

            if (Enum.TryParse<RegistrationStatus>(status, true, out var parsed))
                query = query.Where(r => r.Status == parsed);

            var items = await query
                .OrderByDescending(r => r.CreatedAtUtc)
                .Select(r => new RegistrationSummaryDto(
                    r.Id, r.ReferenceNumber, r.FirstName + " " + r.LastName,
                    db.Organizations.Where(o => o.Id == r.OrganizationId).Select(o => o.Name).FirstOrDefault() ?? "",
                    r.Status.ToString(), r.CreatedAtUtc))
                .ToListAsync(ct);

            return Results.Ok(items);
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.RegistrationView));

        // GET /api/registrations/{id}
        group.MapGet("/{id:guid}", async (
            Guid id, ScopeResolver scope, IAppDbContext db, CancellationToken ct) =>
        {
            var visible = await scope.VisibleOrganizationIdsAsync(ct);

            var reg = await db.ResidentRegistrations.AsNoTracking()
                .Include(r => r.Organization)
                .FirstOrDefaultAsync(r => r.Id == id, ct);
            if (reg is null || !visible.Contains(reg.OrganizationId))
                return Results.NotFound(new { message = "Registration not found." });

            // Suggest existing residents with the same surname and matching birth date or first name.
            var matches = await db.Residents.AsNoTracking()
                .Where(r => r.TenantId == reg.TenantId
                            && r.LastName == reg.LastName
                            && (r.FirstName == reg.FirstName
                                || (reg.BirthDate != null && r.BirthDate == reg.BirthDate)))
                .OrderBy(r => r.FirstName)
                .Take(10)
                .Select(r => new ResidentMatchDto(
                    r.Id, r.ReferenceNumber, r.FirstName + " " + r.LastName, r.BirthDate,
                    r.VerificationStatus.ToString()))
                .ToListAsync(ct);

            var dto = new RegistrationDetailDto(
                reg.Id, reg.ReferenceNumber, reg.FirstName, reg.MiddleName, reg.LastName, reg.Suffix,
                reg.Sex.ToString(), reg.BirthDate, reg.ContactEmail, reg.ContactPhone, reg.Address,
                reg.Organization?.Name ?? "", reg.Status.ToString(), reg.ReviewRemarks,
                reg.ResultResidentId, matches);

            return Results.Ok(dto);
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.RegistrationView));

        // POST /api/registrations/{id}/approve
        group.MapPost("/{id:guid}/approve", async (
            Guid id, ApproveRegistrationRequest request, ScopeResolver scope, ICurrentUser current,
            IReferenceNumberGenerator numbers, IAntiforgery antiforgery, IAppDbContext db,
            HttpContext http, CancellationToken ct) =>
        {
            if (await CsrfError(antiforgery, http) is { } bad) return bad;

            var visible = await scope.VisibleOrganizationIdsAsync(ct);
            var reg = await db.ResidentRegistrations.FirstOrDefaultAsync(r => r.Id == id, ct);
            if (reg is null || !visible.Contains(reg.OrganizationId))
                return Results.NotFound(new { message = "Registration not found." });
            if (reg.Status is RegistrationStatus.Approved or RegistrationStatus.Rejected)
                return Results.Conflict(new { message = "Registration is already resolved." });

            Guid resultResidentId;

            if (request.ResidentId is { } existingId)
            {
                var exists = await db.Residents.AnyAsync(
                    r => r.Id == existingId && r.TenantId == reg.TenantId, ct);
                if (!exists) return Results.BadRequest(new { message = "Matched resident not found." });

                reg.MatchedResidentId = existingId;
                resultResidentId = existingId;
            }
            else
            {
                // Create a new, staff-verified resident from the submitted details (spec §12-13).
                var resident = new Resident
                {
                    TenantId = reg.TenantId,
                    ReferenceNumber = await numbers.NextAsync(reg.TenantId, "RES", ct),
                    FirstName = reg.FirstName,
                    MiddleName = reg.MiddleName,
                    LastName = reg.LastName,
                    Suffix = reg.Suffix,
                    Sex = reg.Sex,
                    BirthDate = reg.BirthDate,
                    ContactEmail = reg.ContactEmail,
                    ContactPhone = reg.ContactPhone,
                    CurrentOrganizationId = reg.OrganizationId,
                    VerificationStatus = VerificationStatus.Verified,
                    VerifiedByUserId = current.UserId,
                    VerifiedAtUtc = DateTimeOffset.UtcNow,
                    VerificationMethod = "Registration review",
                    Residencies =
                    {
                        new ResidentResidency
                        {
                            TenantId = reg.TenantId,
                            OrganizationId = reg.OrganizationId,
                            Address = reg.Address,
                            StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
                            Status = ResidencyStatus.Current,
                        },
                    },
                };
                db.Residents.Add(resident);
                resultResidentId = resident.Id;
            }

            reg.Status = RegistrationStatus.Approved;
            reg.ResultResidentId = resultResidentId;
            reg.ReviewedByUserId = current.UserId;
            reg.ReviewedAtUtc = DateTimeOffset.UtcNow;
            reg.ReviewRemarks = request.Remarks;

            await db.SaveChangesAsync(ct);
            return Results.Ok(new { reg.Id, ResultResidentId = resultResidentId });
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.RegistrationProcess));

        // POST /api/registrations/{id}/reject
        group.MapPost("/{id:guid}/reject", async (
            Guid id, RejectRegistrationRequest request, ScopeResolver scope, ICurrentUser current,
            IAntiforgery antiforgery, IAppDbContext db, HttpContext http, CancellationToken ct) =>
        {
            if (await CsrfError(antiforgery, http) is { } bad) return bad;

            var visible = await scope.VisibleOrganizationIdsAsync(ct);
            var reg = await db.ResidentRegistrations.FirstOrDefaultAsync(r => r.Id == id, ct);
            if (reg is null || !visible.Contains(reg.OrganizationId))
                return Results.NotFound(new { message = "Registration not found." });
            if (reg.Status is RegistrationStatus.Approved or RegistrationStatus.Rejected)
                return Results.Conflict(new { message = "Registration is already resolved." });

            reg.Status = RegistrationStatus.Rejected;
            reg.ReviewedByUserId = current.UserId;
            reg.ReviewedAtUtc = DateTimeOffset.UtcNow;
            reg.ReviewRemarks = request.Remarks;

            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.RegistrationProcess));

        return app;
    }

    private static async Task<IResult?> CsrfError(IAntiforgery antiforgery, HttpContext http)
    {
        try { await antiforgery.ValidateRequestAsync(http); return null; }
        catch (AntiforgeryValidationException)
        {
            return Results.Json(new { message = "Missing or invalid anti-forgery token." },
                statusCode: StatusCodes.Status400BadRequest);
        }
    }
}
