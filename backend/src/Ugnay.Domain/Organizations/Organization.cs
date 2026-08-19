using Ugnay.Domain.Audit;
using Ugnay.Domain.Common;
using Ugnay.Domain.Tenants;

namespace Ugnay.Domain.Organizations;

/// <summary>
/// A node in the government hierarchy (spec §7): City / Municipality → Barangay.
/// Generalized and self-referencing so the structure is data-driven — creating a
/// barangay is a database operation, not new code (spec §9).
/// </summary>
public class Organization : BaseEntity, IAuditableEntity
{
    public Guid? AuditOrganizationId => Id;

    /// <summary>Owning tenant. Every query must be tenant-scoped (spec §6).</summary>
    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    /// <summary>Parent in the hierarchy; null for the top-level LGU (City/Municipality).</summary>
    public Guid? ParentOrganizationId { get; set; }
    public Organization? ParentOrganization { get; set; }
    public ICollection<Organization> Children { get; set; } = [];

    public OrganizationType Type { get; set; }

    /// <summary>Short human-readable code, unique within the tenant (e.g. "BRGY-UGAC-SUR").</summary>
    public required string Code { get; set; }

    /// <summary>URL-safe key used in public portal routing, unique within the tenant (spec §9).</summary>
    public required string Slug { get; set; }

    public required string Name { get; set; }

    public OrganizationStatus Status { get; set; } = OrganizationStatus.Active;

    /// <summary>Optional 1:1 configuration / branding for this organization.</summary>
    public OrganizationSettings? Settings { get; set; }

    /// <summary>Puroks defined under this organization (only meaningful for barangays, spec §35).</summary>
    public ICollection<Purok> Puroks { get; set; } = [];
}
