namespace Ugnay.Domain.Identity;

/// <summary>Account state, independent of the resident's verification status.</summary>
public enum UserStatus
{
    Active = 1,
    Disabled = 2,
}
