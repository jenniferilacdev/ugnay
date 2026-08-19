namespace Ugnay.Domain.Audit;

/// <summary>
/// Marker for entities whose create/update/archive changes are automatically
/// recorded to the audit log (spec §74). Applied to government records.
/// </summary>
public interface IAuditableEntity
{
    /// <summary>Organization scope recorded alongside the audit entry, if any.</summary>
    Guid? AuditOrganizationId { get; }
}
