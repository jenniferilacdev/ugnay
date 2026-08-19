namespace Ugnay.Domain.Common;

/// <summary>
/// Base type for persisted domain entities.
/// Uses a UUID surrogate key (see spec §90) and UTC audit timestamps.
/// Human-readable reference numbers live on the concrete entities that need them.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>When the record was first created (UTC).</summary>
    public DateTimeOffset CreatedAtUtc { get; set; }

    /// <summary>When the record was last modified (UTC), if ever.</summary>
    public DateTimeOffset? UpdatedAtUtc { get; set; }
}
