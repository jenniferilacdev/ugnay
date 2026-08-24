namespace Ugnay.Domain.Residents;

/// <summary>Resident verification lifecycle (spec §13). Registration is never
/// automatically treated as proof of residency (spec §12).</summary>
public enum VerificationStatus
{
    Pending = 1,
    Matched = 2,
    UnderReview = 3,
    Verified = 4,
    Rejected = 5,
    Suspended = 6,
}

/// <summary>Record status. Residents are archived, never hard-deleted (spec §30).</summary>
public enum ResidentStatus
{
    Active = 1,
    Archived = 2,
}

public enum Sex
{
    Male = 1,
    Female = 2,
    Unspecified = 3,
}

public enum CivilStatus
{
    Single = 1,
    Married = 2,
    Widowed = 3,
    Separated = 4,
    Divorced = 5,
    CommonLaw = 6,
    Annulled = 7,
    Other = 8,
}

/// <summary>Employment status (spec-adjacent demographic classification).</summary>
public enum EmploymentStatus
{
    Unspecified = 1,
    Employed = 2,
    Unemployed = 3,
}

/// <summary>Status of a single residency period (spec §14).</summary>
public enum ResidencyStatus
{
    Current = 1,
    Ended = 2,
}
