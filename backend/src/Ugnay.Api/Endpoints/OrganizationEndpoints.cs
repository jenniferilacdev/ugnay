using Microsoft.EntityFrameworkCore;
using Ugnay.Api.Auth;
using Ugnay.Api.Configuration;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Domain.Authorization;
using Ugnay.Domain.Organizations;

namespace Ugnay.Api.Endpoints;

/// <summary>
/// Read endpoints for the organization hierarchy. Requires the
/// <c>organization.view</c> permission and returns only organizations within the
/// caller's tenant and organization scope (spec §6, §15, §103).
/// </summary>
public static class OrganizationEndpoints
{
    public static IEndpointRouteBuilder MapOrganizationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/organizations")
            .WithTags("Organizations")
            .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.OrganizationView));

        // GET /api/organizations/tree — hierarchy the caller may see.
        group.MapGet("/tree", async (ICurrentUser current, IAppDbContext db, CancellationToken ct) =>
        {
            if (current.TenantId is not { } tenantId)
                return Results.BadRequest(new { message = "No tenant context for this account." });

            var orgs = await db.Organizations
                .AsNoTracking()
                .Where(o => o.TenantId == tenantId)
                .Include(o => o.Settings)
                .Include(o => o.Puroks)
                .ToListAsync(ct);

            var byParent = GroupByParent(orgs);
            var visible = ResolveVisible(orgs, byParent, current.ScopeOrganizationIds);

            var roots = orgs.Where(o =>
                visible.Contains(o.Id) &&
                (o.ParentOrganizationId is null || !visible.Contains(o.ParentOrganizationId.Value)));

            var tree = roots.Select(o => BuildNode(o, byParent, visible)).ToList();
            return Results.Ok(tree);
        });

        // GET /api/organizations?type=Barangay — flat list, optionally filtered by type.
        group.MapGet("/", async (string? type, ICurrentUser current, IAppDbContext db, CancellationToken ct) =>
        {
            if (current.TenantId is not { } tenantId)
                return Results.BadRequest(new { message = "No tenant context for this account." });

            var orgs = await db.Organizations
                .AsNoTracking()
                .Where(o => o.TenantId == tenantId)
                .ToListAsync(ct);

            var visible = ResolveVisible(orgs, GroupByParent(orgs), current.ScopeOrganizationIds);

            var items = orgs
                .Where(o => visible.Contains(o.Id))
                .Where(o => string.IsNullOrWhiteSpace(type) ||
                            (Enum.TryParse<OrganizationType>(type, true, out var t) && o.Type == t))
                .OrderBy(o => o.Type)
                .ThenBy(o => o.Name)
                .Select(o => new OrganizationSummaryDto(
                    o.Id, o.ParentOrganizationId, o.Type.ToString(), o.Code, o.Slug,
                    o.Name, o.Status.ToString()))
                .ToList();

            return Results.Ok(items);
        });

        return app;
    }

    private static Dictionary<Guid, List<Organization>> GroupByParent(IEnumerable<Organization> orgs) =>
        orgs.GroupBy(o => o.ParentOrganizationId ?? Guid.Empty)
            .ToDictionary(g => g.Key, g => g.ToList());

    /// <summary>
    /// Set of organization ids the caller may see: each scoped organization plus,
    /// where the scope includes descendants (default), the whole subtree.
    /// </summary>
    private static HashSet<Guid> ResolveVisible(
        IReadOnlyCollection<Organization> orgs,
        IReadOnlyDictionary<Guid, List<Organization>> byParent,
        IReadOnlySet<Guid> scopeOrgIds)
    {
        var visible = new HashSet<Guid>();
        var queue = new Queue<Guid>(orgs.Where(o => scopeOrgIds.Contains(o.Id)).Select(o => o.Id));

        while (queue.Count > 0)
        {
            var id = queue.Dequeue();
            if (!visible.Add(id)) continue;
            if (byParent.TryGetValue(id, out var children))
                foreach (var child in children) queue.Enqueue(child.Id);
        }
        return visible;
    }

    private static OrganizationNodeDto BuildNode(
        Organization org,
        IReadOnlyDictionary<Guid, List<Organization>> byParent,
        IReadOnlySet<Guid> visible)
    {
        var children = byParent.TryGetValue(org.Id, out var kids)
            ? kids.Where(c => visible.Contains(c.Id)).Select(c => BuildNode(c, byParent, visible)).ToList()
            : [];

        var puroks = org.Puroks
            .OrderBy(p => p.Code)
            .Select(p => new PurokDto(p.Id, p.Name, p.Code, p.Status.ToString()))
            .ToList();

        return new OrganizationNodeDto(
            org.Id, org.Type.ToString(), org.Code, org.Slug, org.Name, org.Status.ToString(),
            org.Settings is null ? null : new OrganizationSettingsDto(
                org.Settings.PortalName ?? org.Name,
                org.Settings.Province, org.Settings.Region, org.Settings.Timezone),
            children, puroks);
    }
}

// --- DTOs -------------------------------------------------------------------

public record OrganizationSummaryDto(
    Guid Id, Guid? ParentOrganizationId, string Type, string Code, string Slug,
    string Name, string Status);

public record OrganizationSettingsDto(
    string PortalName, string? Province, string? Region, string Timezone);

public record PurokDto(Guid Id, string Name, string Code, string Status);

public record OrganizationNodeDto(
    Guid Id, string Type, string Code, string Slug, string Name, string Status,
    OrganizationSettingsDto? Settings,
    IReadOnlyList<OrganizationNodeDto> Children,
    IReadOnlyList<PurokDto> Puroks);
