using Microsoft.EntityFrameworkCore;
using Ugnay.Application.Common.Interfaces;

namespace Ugnay.Api.Auth;

/// <summary>
/// Resolves the set of organization ids the current user may act within — each
/// scoped organization plus its descendants (spec §15, §103). Shared by every
/// endpoint that must enforce organization scope.
/// </summary>
public class ScopeResolver(ICurrentUser current, IAppDbContext db)
{
    /// <summary>
    /// Organizations the user may see. When <paramref name="within"/> is supplied
    /// (the header "acting scope"), the result is further narrowed to that org's
    /// subtree — but only if the user's scope actually covers it; otherwise empty.
    /// </summary>
    public async Task<HashSet<Guid>> VisibleOrganizationIdsAsync(
        Guid? within = null, CancellationToken ct = default)
    {
        if (current.TenantId is not { } tenantId)
            return [];

        var orgs = await db.Organizations
            .AsNoTracking()
            .Where(o => o.TenantId == tenantId)
            .Select(o => new { o.Id, o.ParentOrganizationId })
            .ToListAsync(ct);

        var byParent = orgs
            .GroupBy(o => o.ParentOrganizationId ?? Guid.Empty)
            .ToDictionary(g => g.Key, g => g.Select(o => o.Id).ToList());

        var allIds = orgs.Select(o => o.Id).ToHashSet();
        var visible = Expand(current.ScopeOrganizationIds.Where(allIds.Contains), byParent);

        if (within is null)
            return visible;
        if (!visible.Contains(within.Value))
            return [];

        // Narrow to the acting org's subtree (⊆ visible, since `within` is in scope).
        return Expand([within.Value], byParent);
    }

    private static HashSet<Guid> Expand(
        IEnumerable<Guid> roots, IReadOnlyDictionary<Guid, List<Guid>> byParent)
    {
        var result = new HashSet<Guid>();
        var queue = new Queue<Guid>(roots);
        while (queue.Count > 0)
        {
            var id = queue.Dequeue();
            if (!result.Add(id)) continue;
            if (byParent.TryGetValue(id, out var children))
                foreach (var child in children) queue.Enqueue(child);
        }
        return result;
    }
}
