namespace Ugnay.Domain.Organizations;

/// <summary>
/// The kind of government unit an <see cref="Organization"/> represents (spec §7).
/// The hierarchy is generalized so new levels can be added without code that
/// hard-codes specific LGUs or barangays (spec §102, rules 11–12).
///
/// Account levels follow this hierarchy: Province → City/Municipality → Barangay.
/// </summary>
public enum OrganizationType
{
    Province = 1,
    City = 2,
    Municipality = 3,
    Barangay = 4,
}
