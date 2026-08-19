namespace Ugnay.Domain.Organizations;

/// <summary>
/// Lifecycle state of an organization. Government units are deactivated, never
/// hard-deleted (spec §30).
/// </summary>
public enum OrganizationStatus
{
    Active = 1,
    Inactive = 2,
}
