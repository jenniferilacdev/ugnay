namespace Ugnay.Domain.Authorization;

/// <summary>
/// Join: which roles a user holds (spec §100). The user is referenced by id
/// only — the account itself (ASP.NET Core Identity) lives in Infrastructure,
/// keeping the Domain free of an Identity dependency.
/// </summary>
public class UserRole
{
    public Guid UserId { get; set; }

    public Guid RoleId { get; set; }
    public Role? Role { get; set; }
}
