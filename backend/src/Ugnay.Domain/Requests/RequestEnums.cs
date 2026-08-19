namespace Ugnay.Domain.Requests;

/// <summary>Kinds of service request (spec §37).</summary>
public enum RequestCategory
{
    Certificate = 1,
    Program = 2,
    Assistance = 3,
    Asset = 4,
    Facility = 5,
    ProfileCorrection = 6,
    Concern = 7,
    Other = 8,
}

/// <summary>Reusable request lifecycle (spec §31). Individual modules may extend
/// this, but the core states are shared.</summary>
public enum RequestStatus
{
    Draft = 1,
    Submitted = 2,
    UnderReview = 3,
    Approved = 4,
    Rejected = 5,
    Processing = 6,
    Completed = 7,
    Cancelled = 8,
}

public enum RequestPriority
{
    Low = 1,
    Normal = 2,
    High = 3,
    Urgent = 4,
}

/// <summary>Timeline entry types recorded against a request (spec §31, §59).</summary>
public enum RequestEventType
{
    Created = 1,
    Submitted = 2,
    Reviewed = 3,
    Assigned = 4,
    Approved = 5,
    Rejected = 6,
    Started = 7,
    Completed = 8,
    Cancelled = 9,
    Note = 10,
}
