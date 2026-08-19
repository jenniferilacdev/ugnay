using Ugnay.Domain.Audit;
using Ugnay.Domain.Common;
using Ugnay.Domain.Residents;

namespace Ugnay.Domain.Households;

/// <summary>
/// Membership of a resident in a household with a relationship to the head
/// (spec §33). Removed members are retained (LeftDate + Removed status) so
/// household composition history is preserved.
/// </summary>
public class HouseholdMember : BaseEntity, IAuditableEntity
{
    public Guid TenantId { get; set; }

    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }

    public Guid ResidentId { get; set; }
    public Resident? Resident { get; set; }

    public MemberRelationship Relationship { get; set; } = MemberRelationship.Other;
    public bool IsHead { get; set; }

    public DateOnly JoinedDate { get; set; }
    public DateOnly? LeftDate { get; set; }

    public MembershipStatus Status { get; set; } = MembershipStatus.Active;

    public Guid? AuditOrganizationId => null;
}
