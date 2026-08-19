using Ugnay.Domain.Audit;
using Ugnay.Domain.Common;

namespace Ugnay.Domain.Officials;

/// <summary>
/// A person who holds (or has held) office (spec §36). The person is modeled
/// separately from their <see cref="OfficialTerm"/>s so that a single individual
/// can serve multiple terms/positions over time and historical administrations
/// are preserved rather than overwritten.
/// </summary>
public class Official : BaseEntity, IAuditableEntity
{
    public Guid TenantId { get; set; }

    public required string FullName { get; set; }

    public string? PhotoUrl { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }

    public OfficialStatus Status { get; set; } = OfficialStatus.Active;

    public ICollection<OfficialTerm> Terms { get; set; } = [];

    // Attribution happens per term (which carries the organization).
    public Guid? AuditOrganizationId => null;
}
