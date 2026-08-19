using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Ugnay.Domain.Authorization;
using Ugnay.Domain.Identity;
using Ugnay.Infrastructure.Identity;

namespace Ugnay.Infrastructure.Persistence;

/// <summary>
/// Seeds authorization reference data (permission catalog + default role
/// templates, spec §16/§24) and — in Development only — a super admin account.
/// Idempotent: only inserts what is missing.
/// </summary>
public static class IdentitySeeder
{
    /// <summary>Default system role templates and the permission keys they grant.</summary>
    private static readonly (string Key, string Name, string Description, string[] Permissions)[] DefaultRoles =
    [
        ("super-admin", "Super Admin", "Platform administration (spec §17)",
            Permissions.All.Select(p => p.Key).ToArray()),

        ("support", "Support", "Least-privilege technical support (spec §21)",
            [Permissions.UserView]),

        ("lgu-admin", "LGU Admin", "Municipality/city administration (spec §18)",
            [Permissions.OrganizationView, Permissions.OrganizationCreate, Permissions.OrganizationUpdate,
             Permissions.OrganizationArchive, Permissions.PurokView, Permissions.PurokManage,
             Permissions.OfficialView, Permissions.OfficialCreate, Permissions.OfficialUpdate,
             Permissions.OfficialArchive, Permissions.ResidentView, Permissions.ResidentViewSensitive,
             Permissions.ResidentExport, Permissions.HouseholdView, Permissions.RegistrationView,
             Permissions.UserView, Permissions.UserManage, Permissions.RoleView]),

        ("barangay-admin", "Barangay Admin", "Single-barangay administration (spec §19)",
            [Permissions.OrganizationView, Permissions.PurokView, Permissions.PurokManage,
             Permissions.OfficialView, Permissions.OfficialCreate, Permissions.OfficialUpdate,
             Permissions.OfficialArchive, Permissions.ResidentView, Permissions.ResidentViewSensitive,
             Permissions.ResidentCreate, Permissions.ResidentUpdate, Permissions.ResidentVerify,
             Permissions.ResidentArchive, Permissions.ResidentRestore, Permissions.ResidentTransfer,
             Permissions.ResidentExport, Permissions.HouseholdView, Permissions.HouseholdCreate,
             Permissions.HouseholdUpdate, Permissions.HouseholdArchive,
             Permissions.RegistrationView, Permissions.RegistrationProcess,
             Permissions.UserView, Permissions.UserManage, Permissions.RoleView]),

        ("barangay-secretary", "Barangay Secretary", "Records and documentation (spec §20)",
            [Permissions.OrganizationView, Permissions.PurokView, Permissions.OfficialView,
             Permissions.ResidentView, Permissions.ResidentViewSensitive, Permissions.ResidentCreate,
             Permissions.ResidentUpdate, Permissions.HouseholdView, Permissions.HouseholdCreate,
             Permissions.HouseholdUpdate, Permissions.RegistrationView, Permissions.RegistrationProcess,
             Permissions.UserView]),

        ("encoder", "Encoder", "Data entry, no approval or role management (spec §20)",
            [Permissions.OrganizationView, Permissions.PurokView, Permissions.OfficialView,
             Permissions.ResidentView, Permissions.ResidentCreate, Permissions.ResidentUpdate,
             Permissions.HouseholdView, Permissions.HouseholdCreate, Permissions.HouseholdUpdate,
             Permissions.RegistrationView]),
    ];

    public static async Task SeedAsync(
        AppDbContext db,
        UserManager<ApplicationUser> userManager,
        bool seedDevSuperAdmin,
        CancellationToken ct = default)
    {
        await SeedPermissionsAsync(db, ct);
        await SeedRolesAsync(db, ct);
        if (seedDevSuperAdmin)
            await SeedSuperAdminAsync(db, userManager, ct);
    }

    private static async Task SeedPermissionsAsync(AppDbContext db, CancellationToken ct)
    {
        var existing = await db.Permissions.Select(p => p.Key).ToListAsync(ct);
        var missing = Permissions.All.Where(p => !existing.Contains(p.Key));

        foreach (var def in missing)
        {
            db.Permissions.Add(new Permission
            {
                Key = def.Key,
                Resource = def.Resource,
                Action = def.Action,
                Description = def.Description,
            });
        }
        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedRolesAsync(AppDbContext db, CancellationToken ct)
    {
        var permissionsByKey = await db.Permissions.ToDictionaryAsync(p => p.Key, ct);

        foreach (var def in DefaultRoles)
        {
            var role = await db.Roles.FirstOrDefaultAsync(
                r => r.TenantId == null && r.Key == def.Key, ct);
            if (role is null)
            {
                role = new Role
                {
                    TenantId = null,
                    Key = def.Key,
                    Name = def.Name,
                    Description = def.Description,
                    IsSystem = true,
                };
                db.Roles.Add(role);
                await db.SaveChangesAsync(ct);
            }

            // Ensure the role grants exactly its defined permissions (add missing).
            var current = await db.RolePermissions
                .Where(rp => rp.RoleId == role.Id)
                .Select(rp => rp.PermissionId)
                .ToListAsync(ct);

            foreach (var key in def.Permissions)
            {
                if (permissionsByKey.TryGetValue(key, out var perm) && !current.Contains(perm.Id))
                {
                    db.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = perm.Id });
                }
            }
            await db.SaveChangesAsync(ct);
        }
    }

    private static async Task SeedSuperAdminAsync(
        AppDbContext db, UserManager<ApplicationUser> userManager, CancellationToken ct)
    {
        const string email = "admin@ugnay.local";
        if (await userManager.FindByEmailAsync(email) is not null)
            return;

        var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Slug == "tuguegarao", ct);
        var cityOrg = await db.Organizations
            .FirstOrDefaultAsync(o => o.Slug == "tuguegarao" && o.ParentOrganizationId == null, ct);

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FullName = "System Administrator",
            TenantId = tenant?.Id,
            Status = UserStatus.Active,
            CreatedAtUtc = DateTimeOffset.UtcNow,
        };

        // Dev-only credentials. Production provisions the first admin out of band.
        var result = await userManager.CreateAsync(user, "Admin123!");
        if (!result.Succeeded)
            throw new InvalidOperationException(
                "Failed to seed super admin: " +
                string.Join("; ", result.Errors.Select(e => e.Description)));

        var superAdminRole = await db.Roles.FirstAsync(r => r.TenantId == null && r.Key == "super-admin", ct);
        db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = superAdminRole.Id });

        if (cityOrg is not null)
        {
            db.UserOrganizationScopes.Add(new UserOrganizationScope
            {
                UserId = user.Id,
                OrganizationId = cityOrg.Id,
                IncludesDescendants = true,
            });
        }
        await db.SaveChangesAsync(ct);
    }
}
