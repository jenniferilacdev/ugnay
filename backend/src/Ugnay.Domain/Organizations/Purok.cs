using Ugnay.Domain.Audit;
using Ugnay.Domain.Common;

namespace Ugnay.Domain.Organizations;

/// <summary>
/// A barangay's internal community subdivision (spec §35). Puroks belong to a
/// barangay <see cref="Organization"/> and later anchor households, population,
/// announcements, programs, reports, and GIS.
/// </summary>
public class Purok : BaseEntity, IAuditableEntity
{
    public Guid? AuditOrganizationId => BarangayOrganizationId;

    /// <summary>Owning tenant (denormalized for tenant-scoped queries, spec §6).</summary>
    public Guid TenantId { get; set; }

    /// <summary>The barangay organization this purok belongs to.</summary>
    public Guid BarangayOrganizationId { get; set; }
    public Organization? BarangayOrganization { get; set; }

    public required string Name { get; set; }

    /// <summary>Short code, unique within the barangay (e.g. "P1").</summary>
    public required string Code { get; set; }

    public OrganizationStatus Status { get; set; } = OrganizationStatus.Active;
}
