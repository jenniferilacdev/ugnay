namespace Ugnay.Domain.Audit;

/// <summary>
/// Append-only record of an important action (spec §74). Ordinary administrators
/// must not be able to alter audit history, so this type carries no update path
/// and is never soft-edited — rows are only ever inserted.
/// </summary>
public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Tenant the action belongs to (null for platform-level events).</summary>
    public Guid? TenantId { get; set; }

    /// <summary>The acting account, if any (null for anonymous/system actions).</summary>
    public Guid? ActorUserId { get; set; }

    /// <summary>Snapshot of the actor's display name/email at the time.</summary>
    public string? ActorName { get; set; }

    /// <summary>Verb, e.g. "create", "update", "archive", "login", "logout".</summary>
    public required string Action { get; set; }

    /// <summary>Entity/domain the action concerns, e.g. "Organization", "Auth".</summary>
    public required string EntityType { get; set; }

    /// <summary>Identifier of the affected record (string to allow non-GUID keys).</summary>
    public string? EntityId { get; set; }

    /// <summary>Organization scope of the affected record, where applicable.</summary>
    public Guid? OrganizationId { get; set; }

    /// <summary>JSON describing the change or relevant metadata.</summary>
    public string? Changes { get; set; }

    public string? IpAddress { get; set; }

    public DateTimeOffset TimestampUtc { get; set; }
}
