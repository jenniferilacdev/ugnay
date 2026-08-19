using Ugnay.Domain.Audit;
using Ugnay.Domain.Common;
using Ugnay.Domain.Organizations;

namespace Ugnay.Domain.Residents;

/// <summary>
/// A period of residency in a barangay (spec §14). Transfers close the current
/// residency and open a new one — history is preserved, never overwritten.
/// </summary>
public class ResidentResidency : BaseEntity, IAuditableEntity
{
    public Guid TenantId { get; set; }

    public Guid ResidentId { get; set; }
    public Resident? Resident { get; set; }

    /// <summary>The barangay organization of residence.</summary>
    public Guid OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    /// <summary>Optional purok within the barangay.</summary>
    public Guid? PurokId { get; set; }
    public Purok? Purok { get; set; }

    public string? Address { get; set; }

    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }

    public ResidencyStatus Status { get; set; } = ResidencyStatus.Current;

    public Guid? AuditOrganizationId => OrganizationId;
}
