namespace Ugnay.Domain.Households;

/// <summary>Member relationship to the household head (spec §33).</summary>
public enum MemberRelationship
{
    Head = 1,
    Spouse = 2,
    Son = 3,
    Daughter = 4,
    Parent = 5,
    Sibling = 6,
    Relative = 7,
    Other = 8,
}

/// <summary>Household lifecycle status (spec §34).</summary>
public enum HouseholdStatus
{
    Active = 1,
    Inactive = 2,
    Relocated = 3,
    Merged = 4,
    Archived = 5,
}

/// <summary>Membership status. Removed members are kept as history (spec §33).</summary>
public enum MembershipStatus
{
    Active = 1,
    Removed = 2,
}
