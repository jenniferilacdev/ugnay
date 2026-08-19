using Ugnay.Domain.Authorization;

namespace Ugnay.Domain.Requests;

/// <summary>The result of resolving a workflow action against a request's state.</summary>
public record RequestTransition(
    RequestStatus To, RequestEventType EventType, string RequiredPermission);

/// <summary>
/// The reusable approval state machine (spec §31). Defines which actions are
/// legal from each status, the resulting status, and the permission required —
/// so every service module that rides on <see cref="Request"/> shares one
/// consistent, auditable lifecycle.
/// </summary>
public static class RequestWorkflow
{
    public static bool TryResolve(string action, RequestStatus from, out RequestTransition? transition)
    {
        transition = (action?.Trim().ToLowerInvariant(), from) switch
        {
            ("review", RequestStatus.Submitted) =>
                new(RequestStatus.UnderReview, RequestEventType.Reviewed, Permissions.RequestReview),

            ("approve", RequestStatus.UnderReview) =>
                new(RequestStatus.Approved, RequestEventType.Approved, Permissions.RequestApprove),

            ("reject", RequestStatus.Submitted or RequestStatus.UnderReview) =>
                new(RequestStatus.Rejected, RequestEventType.Rejected, Permissions.RequestApprove),

            ("start", RequestStatus.Approved) =>
                new(RequestStatus.Processing, RequestEventType.Started, Permissions.RequestReview),

            ("complete", RequestStatus.Approved or RequestStatus.Processing) =>
                new(RequestStatus.Completed, RequestEventType.Completed, Permissions.RequestReview),

            ("cancel", RequestStatus.Draft or RequestStatus.Submitted or RequestStatus.UnderReview
                       or RequestStatus.Approved or RequestStatus.Processing) =>
                new(RequestStatus.Cancelled, RequestEventType.Cancelled, Permissions.RequestReview),

            _ => null,
        };

        return transition is not null;
    }
}
