using Microsoft.EntityFrameworkCore;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Domain.Organizations;
using Ugnay.Domain.Registrations;
using Ugnay.Domain.Residents;

namespace Ugnay.Api.Endpoints;

public record PublicRegisterRequest(
    string FirstName, string? MiddleName, string LastName, string? Suffix, string? Sex,
    DateOnly? BirthDate, string? ContactEmail, string? ContactPhone, string? Address);

// Public portal DTOs — public information only (spec §10, §92). No resident or
// otherwise sensitive data is ever exposed here.
public record PortalSettingsDto(
    string PortalName, string? Province, string? Region, string? Address,
    string? ContactEmail, string? ContactPhone, string? LogoUrl, string? SealUrl);

public record PortalOrganizationDto(
    Guid Id, string Type, string Slug, string Name, PortalSettingsDto? Settings);

public record PortalBarangaySummaryDto(string Slug, string Name);

public record LguPortalDto(
    PortalOrganizationDto Lgu, IReadOnlyList<PortalBarangaySummaryDto> Barangays);

public record BarangayPortalDto(
    PortalOrganizationDto Lgu, PortalOrganizationDto Barangay, int PurokCount);

/// <summary>
/// Public, unauthenticated barangay/LGU portals resolved by slug (spec §9). The
/// URL resolves LGU → Barangay → portal configuration. Only Active organizations
/// are visible, and only public fields are returned.
/// </summary>
public static class PortalEndpoints
{
    public static IEndpointRouteBuilder MapPortalEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/portal").WithTags("Portal").AllowAnonymous();

        // GET /api/portal/{lguSlug}
        group.MapGet("/{lguSlug}", async (string lguSlug, IAppDbContext db, CancellationToken ct) =>
        {
            var lgu = await FindLguAsync(db, lguSlug, ct);
            if (lgu is null) return Results.NotFound(new { message = "LGU portal not found." });

            var barangays = await db.Organizations
                .AsNoTracking()
                .Where(o => o.TenantId == lgu.TenantId
                            && o.ParentOrganizationId == lgu.Id
                            && o.Type == OrganizationType.Barangay
                            && o.Status == OrganizationStatus.Active)
                .OrderBy(o => o.Name)
                .Select(o => new PortalBarangaySummaryDto(o.Slug, o.Name))
                .ToListAsync(ct);

            return Results.Ok(new LguPortalDto(ToDto(lgu), barangays));
        });

        // GET /api/portal/{lguSlug}/{barangaySlug}
        group.MapGet("/{lguSlug}/{barangaySlug}", async (
            string lguSlug, string barangaySlug, IAppDbContext db, CancellationToken ct) =>
        {
            var lgu = await FindLguAsync(db, lguSlug, ct);
            if (lgu is null) return Results.NotFound(new { message = "LGU portal not found." });

            var barangay = await db.Organizations
                .AsNoTracking()
                .Include(o => o.Settings)
                .FirstOrDefaultAsync(o => o.TenantId == lgu.TenantId
                                          && o.Slug == barangaySlug
                                          && o.Type == OrganizationType.Barangay
                                          && o.Status == OrganizationStatus.Active, ct);

            if (barangay is null)
                return Results.NotFound(new { message = "Barangay portal not found." });

            var purokCount = await db.Puroks
                .CountAsync(p => p.BarangayOrganizationId == barangay.Id
                                 && p.Status == OrganizationStatus.Active, ct);

            return Results.Ok(new BarangayPortalDto(ToDto(lgu), ToDto(barangay), purokCount));
        });

        // POST /api/portal/{lguSlug}/{barangaySlug}/register  (public self-registration, spec §12)
        // Anonymous by design; creates a pending registration for staff review — never a
        // verified resident. (Production adds rate limiting / a challenge here.)
        group.MapPost("/{lguSlug}/{barangaySlug}/register", async (
            string lguSlug, string barangaySlug, PublicRegisterRequest request,
            IReferenceNumberGenerator numbers, IAppDbContext db, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
                return Results.BadRequest(new { message = "First and last name are required." });

            var lgu = await FindLguAsync(db, lguSlug, ct);
            if (lgu is null) return Results.NotFound(new { message = "LGU portal not found." });

            var barangay = await db.Organizations.AsNoTracking().FirstOrDefaultAsync(
                o => o.TenantId == lgu.TenantId && o.Slug == barangaySlug
                     && o.Type == OrganizationType.Barangay && o.Status == OrganizationStatus.Active, ct);
            if (barangay is null) return Results.NotFound(new { message = "Barangay portal not found." });

            var registration = new ResidentRegistration
            {
                TenantId = lgu.TenantId,
                OrganizationId = barangay.Id,
                ReferenceNumber = await numbers.NextAsync(lgu.TenantId, "REG", ct),
                FirstName = request.FirstName.Trim(),
                MiddleName = request.MiddleName,
                LastName = request.LastName.Trim(),
                Suffix = request.Suffix,
                Sex = Enum.TryParse<Sex>(request.Sex, true, out var sex) ? sex : Sex.Unspecified,
                BirthDate = request.BirthDate,
                ContactEmail = request.ContactEmail,
                ContactPhone = request.ContactPhone,
                Address = request.Address,
            };

            db.ResidentRegistrations.Add(registration);
            await db.SaveChangesAsync(ct);

            return Results.Ok(new { registration.ReferenceNumber });
        });

        return app;
    }

    private static Task<Organization?> FindLguAsync(
        IAppDbContext db, string lguSlug, CancellationToken ct) =>
        db.Organizations
            .AsNoTracking()
            .Include(o => o.Settings)
            .FirstOrDefaultAsync(o => o.Slug == lguSlug
                                      && o.ParentOrganizationId == null
                                      && (o.Type == OrganizationType.City
                                          || o.Type == OrganizationType.Municipality)
                                      && o.Status == OrganizationStatus.Active, ct);

    private static PortalOrganizationDto ToDto(Organization o) => new(
        o.Id, o.Type.ToString(), o.Slug, o.Name,
        o.Settings is null ? null : new PortalSettingsDto(
            o.Settings.PortalName ?? o.Name,
            o.Settings.Province, o.Settings.Region, o.Settings.Address,
            o.Settings.ContactEmail, o.Settings.ContactPhone,
            o.Settings.LogoUrl, o.Settings.SealUrl));
}
