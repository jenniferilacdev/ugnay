using Microsoft.AspNetCore.Identity;
using Ugnay.Domain.Identity;

namespace Ugnay.Infrastructure.Identity;

/// <summary>
/// The UGNAY account (spec §11). Backed by ASP.NET Core Identity, which handles
/// password hashing, lockout, and the sign-in surface. A user account is
/// permanent; barangay affiliation (residency) is modeled separately in Phase 2.
/// </summary>
public class ApplicationUser : IdentityUser<Guid>
{
    /// <summary>Owning tenant; null for platform-level accounts (Super Admin / Support).</summary>
    public Guid? TenantId { get; set; }

    public string? FullName { get; set; }

    public UserStatus Status { get; set; } = UserStatus.Active;

    public DateTimeOffset CreatedAtUtc { get; set; }

    /// <summary>
    /// The resident identity this account represents, if any (spec §11). The account
    /// is permanent and separate from the resident record; this is the link between
    /// them. Null for staff/platform accounts.
    /// </summary>
    public Guid? ResidentId { get; set; }
}
