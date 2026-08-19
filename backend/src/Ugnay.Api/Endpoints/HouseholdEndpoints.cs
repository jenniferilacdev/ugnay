using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;
using Ugnay.Api.Auth;
using Ugnay.Api.Configuration;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Domain.Authorization;
using Ugnay.Domain.Households;

namespace Ugnay.Api.Endpoints;

// --- DTOs -------------------------------------------------------------------

public record HouseholdSummaryDto(
    Guid Id, string ReferenceNumber, string Barangay, string? Purok,
    string? HeadName, int MemberCount, string Status);

public record HouseholdMemberDto(
    Guid Id, Guid ResidentId, string ResidentName, string ReferenceNumber,
    string Relationship, bool IsHead, string Status);

public record HouseholdDetailDto(
    Guid Id, string ReferenceNumber, string Barangay, string? Purok, string? Address,
    string? HousingType, string? ContactPhone, string Status,
    IReadOnlyList<HouseholdMemberDto> Members);

public record CreateHouseholdRequest(
    Guid OrganizationId, Guid? PurokId, string? Address, string? HousingType,
    string? ContactPhone, Guid? HeadResidentId);

public record AddMemberRequest(Guid ResidentId, string Relationship);

public record ChangeHeadRequest(Guid MemberId);

/// <summary>
/// Households and their members (spec §33-34). Reads require <c>household.view</c>;
/// writes require <c>household.create</c>/<c>household.update</c>, are CSRF-protected,
/// and are constrained to the caller's organization scope. Member changes preserve
/// history (removed members are retained).
/// </summary>
public static class HouseholdEndpoints
{
    public static IEndpointRouteBuilder MapHouseholdEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/households").WithTags("Households");

        // GET /api/households
        group.MapGet("/", async (ScopeResolver scope, IAppDbContext db, CancellationToken ct) =>
        {
            var visible = await scope.VisibleOrganizationIdsAsync(ct);
            if (visible.Count == 0) return Results.Ok(Array.Empty<HouseholdSummaryDto>());

            var items = await db.Households
                .AsNoTracking()
                .Where(h => visible.Contains(h.OrganizationId))
                .OrderBy(h => h.ReferenceNumber)
                .Select(h => new HouseholdSummaryDto(
                    h.Id, h.ReferenceNumber,
                    db.Organizations.Where(o => o.Id == h.OrganizationId).Select(o => o.Name).FirstOrDefault() ?? "",
                    h.PurokId == null ? null : db.Puroks.Where(p => p.Id == h.PurokId).Select(p => p.Name).FirstOrDefault(),
                    db.Residents.Where(r => r.Id == h.HouseholdHeadResidentId)
                        .Select(r => r.FirstName + " " + r.LastName).FirstOrDefault(),
                    h.Members.Count(m => m.Status == MembershipStatus.Active),
                    h.Status.ToString()))
                .ToListAsync(ct);

            return Results.Ok(items);
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.HouseholdView));

        // GET /api/households/{id}
        group.MapGet("/{id:guid}", async (
            Guid id, ScopeResolver scope, IAppDbContext db, CancellationToken ct) =>
        {
            var visible = await scope.VisibleOrganizationIdsAsync(ct);

            var household = await db.Households
                .AsNoTracking()
                .Include(h => h.Organization)
                .Include(h => h.Purok)
                .Include(h => h.Members).ThenInclude(m => m.Resident)
                .FirstOrDefaultAsync(h => h.Id == id, ct);

            if (household is null || !visible.Contains(household.OrganizationId))
                return Results.NotFound(new { message = "Household not found." });

            var dto = new HouseholdDetailDto(
                household.Id, household.ReferenceNumber, household.Organization?.Name ?? "",
                household.Purok?.Name, household.Address, household.HousingType,
                household.ContactPhone, household.Status.ToString(),
                household.Members
                    .OrderByDescending(m => m.IsHead).ThenBy(m => m.Status)
                    .Select(m => new HouseholdMemberDto(
                        m.Id, m.ResidentId,
                        m.Resident is null ? "" : m.Resident.FirstName + " " + m.Resident.LastName,
                        m.Resident?.ReferenceNumber ?? "", m.Relationship.ToString(), m.IsHead,
                        m.Status.ToString()))
                    .ToList());

            return Results.Ok(dto);
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.HouseholdView));

        // POST /api/households
        group.MapPost("/", async (
            CreateHouseholdRequest request, ScopeResolver scope, ICurrentUser current,
            IReferenceNumberGenerator numbers, IAntiforgery antiforgery, IAppDbContext db,
            HttpContext http, CancellationToken ct) =>
        {
            if (await CsrfError(antiforgery, http) is { } bad) return bad;

            var visible = await scope.VisibleOrganizationIdsAsync(ct);
            if (!visible.Contains(request.OrganizationId))
                return Results.Json(new { message = "Organization is outside your scope." },
                    statusCode: StatusCodes.Status403Forbidden);

            var tenantId = current.TenantId!.Value;
            var household = new Household
            {
                TenantId = tenantId,
                ReferenceNumber = await numbers.NextAsync(tenantId, "HH", ct),
                OrganizationId = request.OrganizationId,
                PurokId = request.PurokId,
                Address = request.Address,
                HousingType = request.HousingType,
                ContactPhone = request.ContactPhone,
            };

            if (request.HeadResidentId is { } headId)
            {
                var headExists = await db.Residents.AnyAsync(
                    r => r.Id == headId && r.TenantId == tenantId, ct);
                if (!headExists)
                    return Results.BadRequest(new { message = "Head resident not found." });

                household.HouseholdHeadResidentId = headId;
                household.Members.Add(new HouseholdMember
                {
                    TenantId = tenantId,
                    ResidentId = headId,
                    Relationship = MemberRelationship.Head,
                    IsHead = true,
                    JoinedDate = DateOnly.FromDateTime(DateTime.UtcNow),
                });
            }

            db.Households.Add(household);
            await db.SaveChangesAsync(ct);

            return Results.Created($"/api/households/{household.Id}",
                new { household.Id, household.ReferenceNumber });
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.HouseholdCreate));

        // POST /api/households/{id}/members
        group.MapPost("/{id:guid}/members", async (
            Guid id, AddMemberRequest request, ScopeResolver scope, ICurrentUser current,
            IAntiforgery antiforgery, IAppDbContext db, HttpContext http, CancellationToken ct) =>
        {
            if (await CsrfError(antiforgery, http) is { } bad) return bad;

            if (!Enum.TryParse<MemberRelationship>(request.Relationship, true, out var relationship)
                || relationship == MemberRelationship.Head)
                return Results.BadRequest(new { message = "Invalid relationship (use Change head for the head)." });

            var visible = await scope.VisibleOrganizationIdsAsync(ct);
            var household = await db.Households.FirstOrDefaultAsync(h => h.Id == id, ct);
            if (household is null || !visible.Contains(household.OrganizationId))
                return Results.NotFound(new { message = "Household not found." });

            var alreadyMember = await db.HouseholdMembers.AnyAsync(
                m => m.ResidentId == request.ResidentId && m.Status == MembershipStatus.Active, ct);
            if (alreadyMember)
                return Results.Conflict(new { message = "Resident is already in an active household." });

            db.HouseholdMembers.Add(new HouseholdMember
            {
                TenantId = current.TenantId!.Value,
                HouseholdId = household.Id,
                ResidentId = request.ResidentId,
                Relationship = relationship,
                JoinedDate = DateOnly.FromDateTime(DateTime.UtcNow),
            });
            await db.SaveChangesAsync(ct);

            return Results.NoContent();
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.HouseholdUpdate));

        // POST /api/households/{id}/members/{memberId}/remove
        group.MapPost("/{id:guid}/members/{memberId:guid}/remove", async (
            Guid id, Guid memberId, ScopeResolver scope, IAntiforgery antiforgery,
            IAppDbContext db, HttpContext http, CancellationToken ct) =>
        {
            if (await CsrfError(antiforgery, http) is { } bad) return bad;

            var visible = await scope.VisibleOrganizationIdsAsync(ct);
            var household = await db.Households
                .Include(h => h.Members)
                .FirstOrDefaultAsync(h => h.Id == id, ct);
            if (household is null || !visible.Contains(household.OrganizationId))
                return Results.NotFound(new { message = "Household not found." });

            var member = household.Members.FirstOrDefault(m => m.Id == memberId);
            if (member is null) return Results.NotFound(new { message = "Member not found." });

            member.Status = MembershipStatus.Removed;
            member.LeftDate = DateOnly.FromDateTime(DateTime.UtcNow);
            if (member.IsHead)
            {
                member.IsHead = false;
                household.HouseholdHeadResidentId = null;
            }
            await db.SaveChangesAsync(ct);

            return Results.NoContent();
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.HouseholdUpdate));

        // POST /api/households/{id}/head
        group.MapPost("/{id:guid}/head", async (
            Guid id, ChangeHeadRequest request, ScopeResolver scope, IAntiforgery antiforgery,
            IAppDbContext db, HttpContext http, CancellationToken ct) =>
        {
            if (await CsrfError(antiforgery, http) is { } bad) return bad;

            var visible = await scope.VisibleOrganizationIdsAsync(ct);
            var household = await db.Households
                .Include(h => h.Members)
                .FirstOrDefaultAsync(h => h.Id == id, ct);
            if (household is null || !visible.Contains(household.OrganizationId))
                return Results.NotFound(new { message = "Household not found." });

            var newHead = household.Members.FirstOrDefault(
                m => m.Id == request.MemberId && m.Status == MembershipStatus.Active);
            if (newHead is null) return Results.NotFound(new { message = "Member not found." });

            foreach (var m in household.Members.Where(m => m.IsHead))
            {
                m.IsHead = false;
                m.Relationship = MemberRelationship.Other; // former head, relationship to new head unknown
            }

            newHead.IsHead = true;
            newHead.Relationship = MemberRelationship.Head;
            household.HouseholdHeadResidentId = newHead.ResidentId;
            await db.SaveChangesAsync(ct);

            return Results.NoContent();
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.HouseholdUpdate));

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
