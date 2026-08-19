using Ugnay.Domain.Audit;
using Ugnay.Domain.Common;
using Ugnay.Domain.Organizations;

namespace Ugnay.Domain.Officials;

/// <summary>
/// One term of service: a position held at an organization for a period (spec §36).
/// Ended terms remain as history — never overwrite past administrations.
/// </summary>
public class OfficialTerm : BaseEntity, IAuditableEntity
{
    public Guid TenantId { get; set; }

    public Guid OfficialId { get; set; }
    public Official? Official { get; set; }

    /// <summary>Organization served (barangay or LGU).</summary>
    public Guid OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    /// <summary>Configurable position title, e.g. "Barangay Captain", "Kagawad".</summary>
    public required string Position { get; set; }

    public string? Committee { get; set; }

    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }

    public TermStatus Status { get; set; } = TermStatus.Active;

    public Guid? AuditOrganizationId => OrganizationId;
}
