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
    public async Task<HashSet<Guid>> VisibleOrganizationIdsAsync(CancellationToken ct = default)
    {
        var visible = new HashSet<Guid>();
        if (current.TenantId is not { } tenantId)
            return visible;

        var orgs = await db.Organizations
            .AsNoTracking()
            .Where(o => o.TenantId == tenantId)
            .Select(o => new { o.Id, o.ParentOrganizationId })
            .ToListAsync(ct);

        var byParent = orgs
            .GroupBy(o => o.ParentOrganizationId ?? Guid.Empty)
            .ToDictionary(g => g.Key, g => g.Select(o => o.Id).ToList());

        var allIds = orgs.Select(o => o.Id).ToHashSet();
        var queue = new Queue<Guid>(current.ScopeOrganizationIds.Where(allIds.Contains));

        while (queue.Count > 0)
        {
            var id = queue.Dequeue();
            if (!visible.Add(id)) continue;
            if (byParent.TryGetValue(id, out var children))
                foreach (var child in children) queue.Enqueue(child);
        }

        return visible;
    }
}
