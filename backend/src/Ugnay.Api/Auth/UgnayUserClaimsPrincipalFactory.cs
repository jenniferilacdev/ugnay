using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Infrastructure.Identity;

namespace Ugnay.Api.Auth;

/// <summary>
/// Builds the ClaimsPrincipal stored in the auth cookie, enriching it with the
/// user's effective permissions (via roles), organization scopes, and tenant.
/// This lets ordinary requests authorize from the cookie without a database hit;
/// claims refresh on next sign-in.
/// </summary>
public class UgnayUserClaimsPrincipalFactory(
    UserManager<ApplicationUser> userManager,
    IOptions<IdentityOptions> optionsAccessor,
    IAppDbContext db)
    : UserClaimsPrincipalFactory<ApplicationUser>(userManager, optionsAccessor)
{
    public override async Task<ClaimsPrincipal> CreateAsync(ApplicationUser user)
    {
        var principal = await base.CreateAsync(user);
        var identity = (ClaimsIdentity)principal.Identity!;

        if (user.TenantId is { } tenantId)
            identity.AddClaim(new Claim(AuthClaims.TenantId, tenantId.ToString()));

        if (!string.IsNullOrWhiteSpace(user.FullName))
            identity.AddClaim(new Claim("name", user.FullName));

        // Effective permissions = distinct permission keys across the user's roles.
        var permissionKeys = await (
            from ur in db.UserRoles
            where ur.UserId == user.Id
            join rp in db.RolePermissions on ur.RoleId equals rp.RoleId
            join p in db.Permissions on rp.PermissionId equals p.Id
            select p.Key).Distinct().ToListAsync();

        foreach (var key in permissionKeys)
            identity.AddClaim(new Claim(AuthClaims.Permission, key));

        var scopeOrgIds = await db.UserOrganizationScopes
            .Where(s => s.UserId == user.Id)
            .Select(s => s.OrganizationId)
            .ToListAsync();

        foreach (var orgId in scopeOrgIds)
            identity.AddClaim(new Claim(AuthClaims.ScopeOrganization, orgId.ToString()));

        return principal;
    }
}
