using Ugnay.Domain.Audit;
using Ugnay.Domain.Common;
using Ugnay.Domain.Organizations;

namespace Ugnay.Domain.Households;

/// <summary>
/// A household within a barangay (spec §33). Archived, never hard-deleted (§30);
/// member changes preserve history.
/// </summary>
public class Household : BaseEntity, IAuditableEntity
{
    public Guid TenantId { get; set; }

    /// <summary>Human-readable reference, e.g. "HH-2026-000001" (spec §41).</summary>
    public required string ReferenceNumber { get; set; }

    /// <summary>The barangay organization the household belongs to.</summary>
    public Guid OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    public Guid? PurokId { get; set; }
    public Purok? Purok { get; set; }

    public string? Address { get; set; }
    public string? HouseNumber { get; set; }
    public string? Street { get; set; }
    public string? Zone { get; set; }
    public string? HousingType { get; set; }
    public string? ContactPhone { get; set; }

    /// <summary>Denormalized current head (resident id) for quick access.</summary>
    public Guid? HouseholdHeadResidentId { get; set; }

    public HouseholdStatus Status { get; set; } = HouseholdStatus.Active;

    public ICollection<HouseholdMember> Members { get; set; } = [];

    public Guid? AuditOrganizationId => OrganizationId;
}
