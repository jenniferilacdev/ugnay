using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Domain.Audit;

namespace Ugnay.Infrastructure.Persistence.Interceptors;

/// <summary>
/// Records create/update/archive of <see cref="IAuditableEntity"/> records to the
/// audit log within the same transaction as the change (spec §74). Attribution
/// comes from <see cref="ICurrentActor"/>.
/// </summary>
public class AuditSaveChangesInterceptor(ICurrentActor actor) : SaveChangesInterceptor
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is not null)
            AddAuditEntries(eventData.Context);

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void AddAuditEntries(DbContext context)
    {
        var now = DateTimeOffset.UtcNow;

        // Materialize first: adding AuditLog entries mutates the change tracker.
        var audited = context.ChangeTracker.Entries<IAuditableEntity>()
            .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .ToList();

        foreach (var entry in audited)
        {
            var action = entry.State switch
            {
                EntityState.Added => "create",
                EntityState.Deleted => "delete",
                _ => "update",
            };

            context.Add(new AuditLog
            {
                TenantId = actor.TenantId,
                ActorUserId = actor.UserId,
                ActorName = actor.Name,
                Action = action,
                EntityType = entry.Entity.GetType().Name,
                EntityId = TryGetKey(entry),
                OrganizationId = entry.Entity.AuditOrganizationId,
                Changes = BuildChanges(entry),
                IpAddress = actor.IpAddress,
                TimestampUtc = now,
            });
        }
    }

    private static string? TryGetKey(EntityEntry entry) =>
        entry.Metadata.FindPrimaryKey()?.Properties is { Count: > 0 } keys
            ? entry.Property(keys[0].Name).CurrentValue?.ToString()
            : null;

    private static string? BuildChanges(EntityEntry entry)
    {
        if (entry.State == EntityState.Modified)
        {
            var changed = entry.Properties
                .Where(p => p.IsModified && p.Metadata.Name != "xmin")
                .ToDictionary(
                    p => p.Metadata.Name,
                    p => new { from = p.OriginalValue, to = p.CurrentValue });

            return changed.Count > 0 ? JsonSerializer.Serialize(changed) : null;
        }

        return null;
    }
}
