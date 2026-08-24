using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Ugnay.Api.Auth;
using Ugnay.Api.Configuration;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Domain.Authorization;
using Ugnay.Domain.Identity;
using Ugnay.Infrastructure.Identity;

namespace Ugnay.Api.Endpoints;

// --- DTOs -------------------------------------------------------------------

public record UserSummaryDto(
    Guid Id, string? Email, string? FullName, string Status,
    IReadOnlyList<string> Barangays, IReadOnlyList<string> Roles);

public record RoleOptionDto(string Key, string Name);

public record CreateUserRequest(
    string Email, string FullName, string Password, Guid OrganizationId, string RoleKey);

/// <summary>
/// User directory and provisioning for the tenant. Reads require <c>user.view</c>;
/// creating accounts requires <c>user.manage</c>. Created accounts are scoped to a
/// single barangay and can sign in immediately with the assigned role.
/// </summary>
public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users").WithTags("Users");

        // GET /api/users?organizationId=  (organizationId = header acting scope)
        group.MapGet("/", async (
            Guid? organizationId, ICurrentUser current, ScopeResolver scope,
            UserManager<ApplicationUser> userManager, IAppDbContext db, CancellationToken ct) =>
        {
            var visible = await scope.VisibleOrganizationIdsAsync(organizationId, ct);
            if (visible.Count == 0) return Results.Ok(Array.Empty<UserSummaryDto>());

            // Users whose scope touches the visible set, with the org names for display.
            var scopes = await db.UserOrganizationScopes.AsNoTracking()
                .Where(s => visible.Contains(s.OrganizationId))
                .Select(s => new { s.UserId, s.OrganizationId, OrgName = s.Organization!.Name })
                .ToListAsync(ct);

            var barangaysByUser = scopes
                .GroupBy(s => s.UserId)
                .ToDictionary(g => g.Key, g => g.Select(x => x.OrgName).Distinct().OrderBy(n => n).ToList());

            var userIds = barangaysByUser.Keys.ToList();
            if (userIds.Count == 0) return Results.Ok(Array.Empty<UserSummaryDto>());

            var rolesByUser = await (
                from ur in db.UserRoles
                where userIds.Contains(ur.UserId)
                join r in db.Roles on ur.RoleId equals r.Id
                select new { ur.UserId, r.Name })
                .ToListAsync(ct);
            var roleLookup = rolesByUser
                .GroupBy(x => x.UserId)
                .ToDictionary(g => g.Key, g => g.Select(x => x.Name).OrderBy(n => n).ToList());

            var users = await userManager.Users.AsNoTracking()
                .Where(u => u.TenantId == current.TenantId && userIds.Contains(u.Id))
                .Select(u => new { u.Id, u.Email, u.FullName, u.Status })
                .ToListAsync(ct);

            var items = users
                .Select(u => new UserSummaryDto(
                    u.Id, u.Email, u.FullName, u.Status.ToString(),
                    barangaysByUser.GetValueOrDefault(u.Id, []),
                    roleLookup.GetValueOrDefault(u.Id, [])))
                .OrderBy(u => u.FullName)
                .ToList();

            return Results.Ok(items);
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.UserView));

        // GET /api/users/roles — assignable role templates (never super admin).
        group.MapGet("/roles", async (IAppDbContext db, CancellationToken ct) =>
        {
            var roles = await db.Roles.AsNoTracking()
                .Where(r => r.TenantId == null && r.Key != "super-admin")
                .OrderBy(r => r.Name)
                .Select(r => new RoleOptionDto(r.Key, r.Name))
                .ToListAsync(ct);
            return Results.Ok(roles);
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.UserView));

        // POST /api/users — provision a barangay-scoped account that can sign in.
        group.MapPost("/", async (
            CreateUserRequest request, ICurrentUser current, ScopeResolver scope,
            UserManager<ApplicationUser> userManager, IAntiforgery antiforgery, IAppDbContext db,
            HttpContext http, CancellationToken ct) =>
        {
            if (await CsrfError(antiforgery, http) is { } bad) return bad;

            if (string.IsNullOrWhiteSpace(request.Email))
                return Results.BadRequest(new { message = "Email is required." });
            if (string.IsNullOrWhiteSpace(request.FullName))
                return Results.BadRequest(new { message = "Full name is required." });
            if (string.IsNullOrWhiteSpace(request.Password))
                return Results.BadRequest(new { message = "Password is required." });
            if (string.Equals(request.RoleKey, "super-admin", StringComparison.OrdinalIgnoreCase))
                return Results.BadRequest(new { message = "That role cannot be assigned here." });

            if (current.TenantId is not { } tenantId)
                return Results.BadRequest(new { message = "No tenant context for this account." });

            var visible = await scope.VisibleOrganizationIdsAsync(ct: ct);
            if (!visible.Contains(request.OrganizationId))
                return Results.Json(new { message = "Barangay is outside your scope." },
                    statusCode: StatusCodes.Status403Forbidden);

            var role = await db.Roles.FirstOrDefaultAsync(
                r => r.TenantId == null && r.Key == request.RoleKey, ct);
            if (role is null)
                return Results.BadRequest(new { message = "Unknown role." });

            var email = request.Email.Trim();
            if (await userManager.FindByEmailAsync(email) is not null)
                return Results.BadRequest(new { message = "An account with that email already exists." });

            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                FullName = request.FullName.Trim(),
                TenantId = tenantId,
                Status = UserStatus.Active,
                CreatedAtUtc = DateTimeOffset.UtcNow,
            };

            var result = await userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
                return Results.BadRequest(new
                {
                    message = string.Join(" ", result.Errors.Select(e => e.Description)),
                });

            db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
            db.UserOrganizationScopes.Add(new UserOrganizationScope
            {
                UserId = user.Id,
                OrganizationId = request.OrganizationId,
                IncludesDescendants = true,
            });
            await db.SaveChangesAsync(ct);

            return Results.Created($"/api/users/{user.Id}", new { user.Id });
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.UserManage));

        return app;
    }

    private static async Task<IResult?> CsrfError(IAntiforgery antiforgery, HttpContext http)
    {
        try { await antiforgery.ValidateRequestAsync(http); return null; }
        catch (AntiforgeryValidationException)
        {
            return Results.Json(new { message = "Missing or invalid anti-forgery token." },
                statusCode: StatusCodes.Status400BadRequest);
        }
    }
}
