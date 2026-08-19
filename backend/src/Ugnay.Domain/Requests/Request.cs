using Ugnay.Domain.Audit;
using Ugnay.Domain.Common;
using Ugnay.Domain.Organizations;

namespace Ugnay.Domain.Requests;

/// <summary>
/// A service request routed through the reusable approval workflow (spec §31, §37).
/// Certificates, program applications, assistance, asset borrowing, facility
/// reservations, profile corrections, and concerns are all built on this.
/// </summary>
public class Request : BaseEntity, IAuditableEntity
{
    public Guid TenantId { get; set; }

    /// <summary>Organization the request is filed with / handled by.</summary>
    public Guid OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    /// <summary>Human-readable reference, e.g. "REQ-2026-000001" (spec §37).</summary>
    public required string ReferenceNumber { get; set; }

    public RequestCategory Category { get; set; }

    public required string Title { get; set; }
    public string? Description { get; set; }

    /// <summary>The resident the request concerns, if any.</summary>
    public Guid? RequestedByResidentId { get; set; }

    public RequestStatus Status { get; set; } = RequestStatus.Submitted;
    public RequestPriority Priority { get; set; } = RequestPriority.Normal;

    /// <summary>Staff account currently handling the request, if assigned.</summary>
    public Guid? AssignedToUserId { get; set; }

    public DateTimeOffset? CompletedAtUtc { get; set; }

    /// <summary>Chronological workflow/decision log (spec §31, §59).</summary>
    public ICollection<RequestEvent> Events { get; set; } = [];

    public Guid? AuditOrganizationId => OrganizationId;
}
