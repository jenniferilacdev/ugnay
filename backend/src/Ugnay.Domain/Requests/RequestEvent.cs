using Ugnay.Domain.Common;

namespace Ugnay.Domain.Requests;

/// <summary>
/// One entry in a request's activity timeline (spec §31, §59). Every decision
/// records the actor, organization, timestamp, and remarks. Append-only.
/// </summary>
public class RequestEvent : BaseEntity
{
    public Guid RequestId { get; set; }
    public Request? Request { get; set; }

    public RequestEventType Type { get; set; }

    public RequestStatus? FromStatus { get; set; }
    public RequestStatus? ToStatus { get; set; }

    public Guid? ActorUserId { get; set; }
    public string? ActorName { get; set; }
    public Guid OrganizationId { get; set; }

    public string? Remarks { get; set; }
}
