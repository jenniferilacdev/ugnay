namespace Ugnay.Domain.Organizations;

/// <summary>
/// The kind of government unit an <see cref="Organization"/> represents (spec §7).
/// The hierarchy is generalized so new levels can be added without code that
/// hard-codes specific LGUs or barangays (spec §102, rules 11–12).
/// </summary>
public enum OrganizationType
{
    City = 1,
    Municipality = 2,
    Barangay = 3,
}
