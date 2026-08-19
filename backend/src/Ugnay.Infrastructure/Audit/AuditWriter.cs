using System.Text.Json;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Domain.Audit;

namespace Ugnay.Infrastructure.Audit;

/// <summary>
/// Records explicit (non-entity) audit events such as login/logout (spec §74).
/// </summary>
public class AuditWriter(IAppDbContext db, ICurrentActor actor) : IAuditWriter
{
    public async Task WriteAsync(
        string action,
        string entityType,
        string? entityId = null,
        Guid? organizationId = null,
        object? changes = null,
        CancellationToken cancellationToken = default)
    {
        db.AuditLogs.Add(new AuditLog
        {
            TenantId = actor.TenantId,
            ActorUserId = actor.UserId,
            ActorName = actor.Name,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            OrganizationId = organizationId,
            Changes = changes is null ? null : JsonSerializer.Serialize(changes),
            IpAddress = actor.IpAddress,
            TimestampUtc = DateTimeOffset.UtcNow,
        });

        await db.SaveChangesAsync(cancellationToken);
    }
}
