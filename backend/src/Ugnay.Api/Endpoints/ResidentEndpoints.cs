using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;
using Ugnay.Api.Auth;
using Ugnay.Api.Configuration;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Domain.Assistance;
using Ugnay.Domain.Authorization;
using Ugnay.Domain.Residents;

namespace Ugnay.Api.Endpoints;

// --- DTOs -------------------------------------------------------------------

public record ResidentSummaryDto(
    Guid Id, string ReferenceNumber, string FullName, string Sex,
    string? CurrentBarangay, string VerificationStatus, string Status);

public record ResidencyDto(
    Guid Id, Guid OrganizationId, string OrganizationName, string? Purok,
    string? Address, DateOnly StartDate, DateOnly? EndDate, string Status);

/// <summary>Sensitive fields — only populated when the caller holds
/// <c>resident.view_sensitive</c> (spec §25, §92).</summary>
public record ResidentSensitiveDto(
    DateOnly? BirthDate, string? BirthPlace, string? ContactEmail, string? ContactPhone,
    string? EmergencyContactName, string? EmergencyContactPhone);

public record ResidentProgramDto(Guid Id, string Code, string Name);

/// <summary>Sectoral classifications and employment (matches the reference form).</summary>
public record ResidentClassificationsDto(
    string? VoterId,
    bool IsSoloParent, string? SoloParentId,
    bool IsSeniorCitizen, string? SeniorCitizenId,
    bool HasDisability, string? DisabilityId, string? DisabilityType,
    string EmploymentStatus, string? EmployedType, string? UnemployedType);

public record ResidentDetailDto(
    Guid Id, string ReferenceNumber, string FirstName, string? MiddleName, string LastName,
    string? Suffix, string FullName, string Sex, string CivilStatus, string? Occupation,
    string? Education, string VerificationStatus, string? VerificationMethod,
    string? VerificationRemarks, DateTimeOffset? VerifiedAtUtc, string Status,
    ResidentSensitiveDto? Sensitive, ResidentClassificationsDto Classifications,
    IReadOnlyList<ResidentProgramDto> AssistancePrograms, IReadOnlyList<ResidencyDto> Residencies);

public record CreateResidentRequest(
    string FirstName, string? MiddleName, string LastName, string? Suffix, string? Sex,
    DateOnly? BirthDate, string? CivilStatus, Guid OrganizationId, Guid? PurokId, string? Address,
    string? ContactPhone, string? VoterId,
    Guid? HouseholdId, string? Relationship, string? HouseNumber, string? Street, string? Zone,
    bool? CreateHousehold,
    bool? IsSoloParent, string? SoloParentId,
    bool? IsSeniorCitizen, string? SeniorCitizenId,
    bool? HasDisability, string? DisabilityId, string? DisabilityType,
    string? EmploymentStatus, string? EmployedType, string? UnemployedType,
    IReadOnlyList<Guid>? AssistanceProgramIds);

public record VerifyResidentRequest(string Status, string? Method, string? Remarks);

public record TransferResidentRequest(
    Guid ToOrganizationId, Guid? PurokId, string? Address, DateOnly? StartDate);

public record UpdateResidentRequest(
    string FirstName, string? MiddleName, string LastName, string? Suffix,
    string? Sex, DateOnly? BirthDate, string? CivilStatus, string? ContactPhone, string? VoterId);

/// <summary>
/// Resident registry (spec §13, §14, §32). Reads require <c>resident.view</c>
/// (sensitive fields additionally require <c>resident.view_sensitive</c>); writes
/// require the matching permission, are CSRF-protected, and are constrained to the
/// caller's organization scope.
/// </summary>
public static class ResidentEndpoints
{
    public static IEndpointRouteBuilder MapResidentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/residents").WithTags("Residents");

        // GET /api/residents?organizationId=  (organizationId = header acting scope)
        group.MapGet("/", async (
            Guid? organizationId, ScopeResolver scope, IAppDbContext db, CancellationToken ct) =>
        {
            var visible = await scope.VisibleOrganizationIdsAsync(organizationId, ct);
            if (visible.Count == 0) return Results.Ok(Array.Empty<ResidentSummaryDto>());

            var items = await db.Residents
                .AsNoTracking()
                .Where(r => r.CurrentOrganizationId != null && visible.Contains(r.CurrentOrganizationId.Value))
                .Where(r => r.Status != ResidentStatus.Archived)
                .OrderBy(r => r.LastName).ThenBy(r => r.FirstName)
                .Select(r => new ResidentSummaryDto(
                    r.Id, r.ReferenceNumber,
                    r.FirstName + (r.MiddleName != null ? " " + r.MiddleName : "") + " " + r.LastName,
                    r.Sex.ToString(),
                    db.Organizations.Where(o => o.Id == r.CurrentOrganizationId).Select(o => o.Name).FirstOrDefault(),
                    r.VerificationStatus.ToString(), r.Status.ToString()))
                .ToListAsync(ct);

            return Results.Ok(items);
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.ResidentView));

        // GET /api/residents/{id}
        group.MapGet("/{id:guid}", async (
            Guid id, ICurrentUser current, ScopeResolver scope, IAppDbContext db, CancellationToken ct) =>
        {
            var visible = await scope.VisibleOrganizationIdsAsync(ct: ct);

            var resident = await db.Residents
                .AsNoTracking()
                .Include(r => r.Residencies).ThenInclude(x => x.Organization)
                .Include(r => r.Residencies).ThenInclude(x => x.Purok)
                .Include(r => r.AssistancePrograms).ThenInclude(x => x.AssistanceProgram)
                .FirstOrDefaultAsync(r => r.Id == id, ct);

            if (resident is null ||
                resident.CurrentOrganizationId is not { } org || !visible.Contains(org))
                return Results.NotFound(new { message = "Resident not found." });

            var canSeeSensitive = current.HasPermission(Permissions.ResidentViewSensitive);

            var dto = new ResidentDetailDto(
                resident.Id, resident.ReferenceNumber, resident.FirstName, resident.MiddleName,
                resident.LastName, resident.Suffix, resident.FullName, resident.Sex.ToString(),
                resident.CivilStatus.ToString(), resident.Occupation, resident.Education,
                resident.VerificationStatus.ToString(), resident.VerificationMethod,
                resident.VerificationRemarks, resident.VerifiedAtUtc, resident.Status.ToString(),
                canSeeSensitive
                    ? new ResidentSensitiveDto(
                        resident.BirthDate, resident.BirthPlace, resident.ContactEmail,
                        resident.ContactPhone, resident.EmergencyContactName, resident.EmergencyContactPhone)
                    : null,
                new ResidentClassificationsDto(
                    resident.VoterId,
                    resident.IsSoloParent, resident.SoloParentId,
                    resident.IsSeniorCitizen, resident.SeniorCitizenId,
                    resident.HasDisability, resident.DisabilityId, resident.DisabilityType,
                    resident.EmploymentStatus.ToString(), resident.EmployedType, resident.UnemployedType),
                resident.AssistancePrograms
                    .Where(p => p.AssistanceProgram != null)
                    .Select(p => new ResidentProgramDto(
                        p.AssistanceProgram!.Id, p.AssistanceProgram.Code, p.AssistanceProgram.Name))
                    .OrderBy(p => p.Code)
                    .ToList(),
                resident.Residencies
                    .OrderByDescending(x => x.StartDate)
                    .Select(x => new ResidencyDto(
                        x.Id, x.OrganizationId, x.Organization?.Name ?? "", x.Purok?.Name,
                        x.Address, x.StartDate, x.EndDate, x.Status.ToString()))
                    .ToList());

            return Results.Ok(dto);
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.ResidentView));

        // POST /api/residents
        group.MapPost("/", async (
            CreateResidentRequest request, ScopeResolver scope, ICurrentUser current,
            IReferenceNumberGenerator numbers, IAntiforgery antiforgery, IAppDbContext db,
            HttpContext http, CancellationToken ct) =>
        {
            if (await CsrfError(antiforgery, http) is { } bad) return bad;

            if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
                return Results.BadRequest(new { message = "First and last name are required." });

            var visible = await scope.VisibleOrganizationIdsAsync(ct: ct);
            if (!visible.Contains(request.OrganizationId))
                return Results.Json(new { message = "Organization is outside your scope." },
                    statusCode: StatusCodes.Status403Forbidden);

            var tenantId = current.TenantId!.Value;
            var referenceNumber = await numbers.NextAsync(tenantId, "RES", ct);

            var resident = new Resident
            {
                TenantId = tenantId,
                ReferenceNumber = referenceNumber,
                FirstName = request.FirstName.Trim(),
                MiddleName = request.MiddleName,
                LastName = request.LastName.Trim(),
                Suffix = request.Suffix,
                Sex = ParseEnum(request.Sex, Sex.Unspecified),
                BirthDate = request.BirthDate,
                CivilStatus = ParseEnum(request.CivilStatus, CivilStatus.Single),
                ContactPhone = request.ContactPhone,
                VoterId = request.VoterId,
                IsSoloParent = request.IsSoloParent ?? false,
                SoloParentId = request.IsSoloParent == true ? request.SoloParentId : null,
                IsSeniorCitizen = request.IsSeniorCitizen ?? false,
                SeniorCitizenId = request.IsSeniorCitizen == true ? request.SeniorCitizenId : null,
                HasDisability = request.HasDisability ?? false,
                DisabilityId = request.HasDisability == true ? request.DisabilityId : null,
                DisabilityType = request.HasDisability == true ? request.DisabilityType : null,
                EmploymentStatus = ParseEnum(request.EmploymentStatus, EmploymentStatus.Unspecified),
                EmployedType = request.EmployedType,
                UnemployedType = request.UnemployedType,
                CurrentOrganizationId = request.OrganizationId,
                Residencies =
                {
                    new ResidentResidency
                    {
                        TenantId = tenantId,
                        OrganizationId = request.OrganizationId,
                        PurokId = request.PurokId,
                        Address = ComposeAddress(request.HouseNumber, request.Street, request.Zone)
                                  ?? request.Address,
                        StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
                        Status = ResidencyStatus.Current,
                    },
                },
            };

            // Enrol in selected assistance programs that belong to the tenant.
            if (request.AssistanceProgramIds is { Count: > 0 } programIds)
            {
                var validIds = await db.AssistancePrograms
                    .Where(p => p.TenantId == tenantId && programIds.Contains(p.Id))
                    .Select(p => p.Id)
                    .ToListAsync(ct);
                foreach (var pid in validIds)
                    resident.AssistancePrograms.Add(new ResidentAssistanceProgram { AssistanceProgramId = pid });
            }

            db.Residents.Add(resident);

            // Household placement (spec §33): join an existing household, or create a
            // new one with this resident as its head.
            if (request.HouseholdId is { } householdId)
            {
                var household = await db.Households.FirstOrDefaultAsync(
                    h => h.Id == householdId && h.OrganizationId == request.OrganizationId
                         && visible.Contains(h.OrganizationId), ct);
                if (household is not null)
                {
                    db.HouseholdMembers.Add(new Ugnay.Domain.Households.HouseholdMember
                    {
                        TenantId = tenantId,
                        HouseholdId = household.Id,
                        ResidentId = resident.Id,
                        Relationship = Enum.TryParse<Ugnay.Domain.Households.MemberRelationship>(
                            request.Relationship, true, out var rel)
                            ? rel : Ugnay.Domain.Households.MemberRelationship.Other,
                        JoinedDate = DateOnly.FromDateTime(DateTime.UtcNow),
                    });
                }
            }
            else if (request.CreateHousehold == true)
            {
                var household = new Ugnay.Domain.Households.Household
                {
                    TenantId = tenantId,
                    ReferenceNumber = await numbers.NextAsync(tenantId, "HH", ct),
                    OrganizationId = request.OrganizationId,
                    PurokId = request.PurokId,
                    HouseNumber = request.HouseNumber,
                    Street = request.Street,
                    Zone = request.Zone,
                    HouseholdHeadResidentId = resident.Id,
                    Members =
                    {
                        new Ugnay.Domain.Households.HouseholdMember
                        {
                            TenantId = tenantId,
                            ResidentId = resident.Id,
                            Relationship = Ugnay.Domain.Households.MemberRelationship.Head,
                            IsHead = true,
                            JoinedDate = DateOnly.FromDateTime(DateTime.UtcNow),
                        },
                    },
                };
                db.Households.Add(household);
            }

            await db.SaveChangesAsync(ct);

            return Results.Created($"/api/residents/{resident.Id}",
                new { resident.Id, resident.ReferenceNumber });
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.ResidentCreate));

        // POST /api/residents/{id}/verify
        group.MapPost("/{id:guid}/verify", async (
            Guid id, VerifyResidentRequest request, ScopeResolver scope, ICurrentUser current,
            IAntiforgery antiforgery, IAppDbContext db, HttpContext http, CancellationToken ct) =>
        {
            if (await CsrfError(antiforgery, http) is { } bad) return bad;

            if (!Enum.TryParse<VerificationStatus>(request.Status, true, out var status))
                return Results.BadRequest(new { message = "Invalid verification status." });

            var visible = await scope.VisibleOrganizationIdsAsync(ct: ct);
            var resident = await db.Residents.FirstOrDefaultAsync(r => r.Id == id, ct);
            if (resident is null ||
                resident.CurrentOrganizationId is not { } org || !visible.Contains(org))
                return Results.NotFound(new { message = "Resident not found." });

            resident.VerificationStatus = status;
            resident.VerifiedByUserId = current.UserId;
            resident.VerifiedAtUtc = DateTimeOffset.UtcNow;
            resident.VerificationMethod = request.Method;
            resident.VerificationRemarks = request.Remarks;

            await db.SaveChangesAsync(ct);
            return Results.Ok(new { resident.Id, VerificationStatus = status.ToString() });
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.ResidentVerify));

        // POST /api/residents/{id}/transfer
        group.MapPost("/{id:guid}/transfer", async (
            Guid id, TransferResidentRequest request, ScopeResolver scope,
            IAntiforgery antiforgery, IAppDbContext db, HttpContext http, CancellationToken ct) =>
        {
            if (await CsrfError(antiforgery, http) is { } bad) return bad;

            var visible = await scope.VisibleOrganizationIdsAsync(ct: ct);
            if (!visible.Contains(request.ToOrganizationId))
                return Results.Json(new { message = "Destination organization is outside your scope." },
                    statusCode: StatusCodes.Status403Forbidden);

            var resident = await db.Residents
                .Include(r => r.Residencies)
                .FirstOrDefaultAsync(r => r.Id == id, ct);
            if (resident is null ||
                resident.CurrentOrganizationId is not { } org || !visible.Contains(org))
                return Results.NotFound(new { message = "Resident not found." });

            var start = request.StartDate ?? DateOnly.FromDateTime(DateTime.UtcNow);

            // Close the current residency, preserving it as history (spec §14).
            foreach (var current in resident.Residencies.Where(r => r.Status == ResidencyStatus.Current))
            {
                current.Status = ResidencyStatus.Ended;
                current.EndDate = start;
            }

            // Add via the DbSet (not the tracked navigation) so EF marks it Added
            // and issues an INSERT rather than a full-column UPDATE.
            db.ResidentResidencies.Add(new ResidentResidency
            {
                TenantId = resident.TenantId,
                ResidentId = resident.Id,
                OrganizationId = request.ToOrganizationId,
                PurokId = request.PurokId,
                Address = request.Address,
                StartDate = start,
                Status = ResidencyStatus.Current,
            });
            resident.CurrentOrganizationId = request.ToOrganizationId;

            await db.SaveChangesAsync(ct);
            return Results.Ok(new { resident.Id, CurrentOrganizationId = request.ToOrganizationId });
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.ResidentTransfer));

        // POST /api/residents/{id}/update — edit core identity and contact fields.
        group.MapPost("/{id:guid}/update", async (
            Guid id, UpdateResidentRequest request, ScopeResolver scope,
            IAntiforgery antiforgery, IAppDbContext db, HttpContext http, CancellationToken ct) =>
        {
            if (await CsrfError(antiforgery, http) is { } bad) return bad;

            if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
                return Results.BadRequest(new { message = "First and last name are required." });

            var visible = await scope.VisibleOrganizationIdsAsync(ct: ct);
            var resident = await db.Residents.FirstOrDefaultAsync(r => r.Id == id, ct);
            if (resident is null ||
                resident.CurrentOrganizationId is not { } org || !visible.Contains(org))
                return Results.NotFound(new { message = "Resident not found." });

            resident.FirstName = request.FirstName.Trim();
            resident.MiddleName = request.MiddleName;
            resident.LastName = request.LastName.Trim();
            resident.Suffix = request.Suffix;
            if (Enum.TryParse<Sex>(request.Sex, true, out var sex)) resident.Sex = sex;
            if (Enum.TryParse<CivilStatus>(request.CivilStatus, true, out var civil)) resident.CivilStatus = civil;
            resident.BirthDate = request.BirthDate;
            resident.ContactPhone = request.ContactPhone;
            resident.VoterId = request.VoterId;

            await db.SaveChangesAsync(ct);
            return Results.Ok(new { resident.Id });
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.ResidentUpdate));

        // POST /api/residents/{id}/delete — archive (soft delete; history preserved).
        group.MapPost("/{id:guid}/delete", async (
            Guid id, ScopeResolver scope, IAntiforgery antiforgery,
            IAppDbContext db, HttpContext http, CancellationToken ct) =>
        {
            if (await CsrfError(antiforgery, http) is { } bad) return bad;

            var visible = await scope.VisibleOrganizationIdsAsync(ct: ct);
            var resident = await db.Residents.FirstOrDefaultAsync(r => r.Id == id, ct);
            if (resident is null ||
                resident.CurrentOrganizationId is not { } org || !visible.Contains(org))
                return Results.NotFound(new { message = "Resident not found." });

            resident.Status = ResidentStatus.Archived;
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.ResidentArchive));

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

    /// <summary>Builds "houseNumber street, zone" from the parts, skipping blanks.</summary>
    private static string? ComposeAddress(string? houseNumber, string? street, string? zone)
    {
        var line = string.Join(" ", new[] { houseNumber, street }.Where(s => !string.IsNullOrWhiteSpace(s)));
        var parts = new[] { line, zone }.Where(s => !string.IsNullOrWhiteSpace(s));
        var composed = string.Join(", ", parts);
        return string.IsNullOrWhiteSpace(composed) ? null : composed;
    }

    private static TEnum ParseEnum<TEnum>(string? value, TEnum fallback) where TEnum : struct, Enum =>
        Enum.TryParse<TEnum>(value, true, out var parsed) ? parsed : fallback;
}
