using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;
using Ugnay.Api.Auth;
using Ugnay.Api.Configuration;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Domain.Authorization;
using Ugnay.Domain.Officials;

namespace Ugnay.Api.Endpoints;

public record OfficialTermDto(
    Guid Id, Guid OrganizationId, string OrganizationName, string Position,
    string? Committee, DateOnly StartDate, DateOnly? EndDate, string Status);

public record OfficialDto(
    Guid Id, string FullName, string? ContactEmail, string? ContactPhone,
    string Status, IReadOnlyList<OfficialTermDto> Terms);

public record CreateOfficialRequest(
    string FullName, string? ContactEmail, string? ContactPhone,
    Guid OrganizationId, string Position, string? Committee, DateOnly? StartDate);

/// <summary>
/// Officials and their terms of service (spec §36). Reads require
/// <c>official.view</c>; writes require <c>official.create</c>, are CSRF-protected,
/// and are constrained to the caller's organization scope.
/// </summary>
public static class OfficialEndpoints
{
    public static IEndpointRouteBuilder MapOfficialEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/officials").WithTags("Officials");

        // GET /api/officials?organizationId={id}
        group.MapGet("/", async (
            Guid? organizationId, ScopeResolver scope, IAppDbContext db, CancellationToken ct) =>
        {
            var visible = await scope.VisibleOrganizationIdsAsync(ct);
            if (visible.Count == 0) return Results.Ok(Array.Empty<OfficialDto>());

            var terms = await db.OfficialTerms
                .AsNoTracking()
                .Include(t => t.Organization)
                .Include(t => t.Official)
                .Where(t => visible.Contains(t.OrganizationId)
                            && (organizationId == null || t.OrganizationId == organizationId))
                .ToListAsync(ct);

            var officials = terms
                .Where(t => t.Official is not null)
                .GroupBy(t => t.Official!)
                .Select(g => new OfficialDto(
                    g.Key.Id, g.Key.FullName, g.Key.ContactEmail, g.Key.ContactPhone,
                    g.Key.Status.ToString(),
                    g.OrderByDescending(t => t.StartDate)
                        .Select(t => new OfficialTermDto(
                            t.Id, t.OrganizationId, t.Organization?.Name ?? "",
                            t.Position, t.Committee, t.StartDate, t.EndDate, t.Status.ToString()))
                        .ToList()))
                .OrderBy(o => o.FullName)
                .ToList();

            return Results.Ok(officials);
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.OfficialView));

        // POST /api/officials
        group.MapPost("/", async (
            CreateOfficialRequest request,
            ScopeResolver scope,
            ICurrentUser current,
            IAntiforgery antiforgery,
            IAppDbContext db,
            HttpContext http,
            CancellationToken ct) =>
        {
            try { await antiforgery.ValidateRequestAsync(http); }
            catch (AntiforgeryValidationException)
            {
                return Results.Json(new { message = "Missing or invalid anti-forgery token." },
                    statusCode: StatusCodes.Status400BadRequest);
            }

            if (string.IsNullOrWhiteSpace(request.FullName))
                return Results.BadRequest(new { message = "Full name is required." });
            if (string.IsNullOrWhiteSpace(request.Position))
                return Results.BadRequest(new { message = "Position is required." });

            var visible = await scope.VisibleOrganizationIdsAsync(ct);
            if (!visible.Contains(request.OrganizationId))
                return Results.Json(new { message = "Organization is outside your scope." },
                    statusCode: StatusCodes.Status403Forbidden);

            var tenantId = current.TenantId!.Value;
            var official = new Official
            {
                TenantId = tenantId,
                FullName = request.FullName.Trim(),
                ContactEmail = request.ContactEmail,
                ContactPhone = request.ContactPhone,
                Terms =
                {
                    new OfficialTerm
                    {
                        TenantId = tenantId,
                        OrganizationId = request.OrganizationId,
                        Position = request.Position.Trim(),
                        Committee = request.Committee,
                        StartDate = request.StartDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
                    },
                },
            };

            db.Officials.Add(official);
            await db.SaveChangesAsync(ct);

            return Results.Created($"/api/officials/{official.Id}", new { official.Id });
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.OfficialCreate));

        return app;
    }
}
