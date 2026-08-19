namespace Ugnay.Domain.Common;

/// <summary>
/// Per-tenant, per-prefix, per-year counter backing human-readable reference
/// numbers (spec §41). Incremented atomically — never derived from COUNT(*).
/// </summary>
public class ReferenceCounter
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public required string Prefix { get; set; }
    public int Year { get; set; }
    public long NextValue { get; set; }
}
