using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;
using Ugnay.Api.Auth;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Domain.Identity;
using Ugnay.Infrastructure.Identity;

namespace Ugnay.Api.Endpoints;

public record LoginRequest(string Email, string Password);

public record CurrentUserDto(
    Guid UserId, string? Email, string? FullName, Guid? TenantId,
    IReadOnlyList<string> Permissions, IReadOnlyList<Guid> ScopeOrganizationIds);

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        // Issues an anti-forgery token (and cookie). The SPA calls this before writes.
        group.MapGet("/csrf", (IAntiforgery antiforgery, HttpContext http) =>
        {
            var tokens = antiforgery.GetAndStoreTokens(http);
            return Results.Ok(new { token = tokens.RequestToken });
        });

        group.MapPost("/login", async (
            LoginRequest request,
            SignInManager<ApplicationUser> signInManager,
            UserManager<ApplicationUser> userManager,
            IUserClaimsPrincipalFactory<ApplicationUser> claimsFactory,
            IAuditWriter audit,
            HttpContext http) =>
        {
            var user = await userManager.FindByEmailAsync(request.Email);
            if (user is null)
                return Results.Json(new { message = "Invalid email or password." },
                    statusCode: StatusCodes.Status401Unauthorized);

            if (user.Status != UserStatus.Active)
                return Results.Json(new { message = "This account is disabled." },
                    statusCode: StatusCodes.Status403Forbidden);

            var result = await signInManager.PasswordSignInAsync(
                user, request.Password, isPersistent: true, lockoutOnFailure: true);

            if (result.IsLockedOut)
                return Results.Json(new { message = "Account locked. Try again later." },
                    statusCode: StatusCodes.Status423Locked);

            if (!result.Succeeded)
                return Results.Json(new { message = "Invalid email or password." },
                    statusCode: StatusCodes.Status401Unauthorized);

            await audit.WriteAsync("login", "Auth", user.Id.ToString(),
                changes: new { user.Email });

            // http.User is still anonymous within this request; build the response
            // from a freshly materialized principal so it carries the claims.
            var enriched = await claimsFactory.CreateAsync(user);
            return Results.Ok(BuildCurrentUser(enriched, user));
        });

        group.MapPost("/logout", async (
            SignInManager<ApplicationUser> signInManager,
            IAntiforgery antiforgery,
            IAuditWriter audit,
            ICurrentUser current,
            HttpContext http) =>
        {
            try
            {
                await antiforgery.ValidateRequestAsync(http);
            }
            catch (AntiforgeryValidationException)
            {
                return Results.Json(new { message = "Missing or invalid anti-forgery token." },
                    statusCode: StatusCodes.Status400BadRequest);
            }

            await audit.WriteAsync("logout", "Auth", current.UserId?.ToString());
            await signInManager.SignOutAsync();
            return Results.NoContent();
        }).RequireAuthorization();

        group.MapGet("/me", (ClaimsPrincipal principal, ICurrentUser current) =>
        {
            if (!current.IsAuthenticated || current.UserId is null)
                return Results.Unauthorized();

            return Results.Ok(new CurrentUserDto(
                current.UserId.Value,
                principal.Identity?.Name,
                principal.FindFirstValue("name"),
                current.TenantId,
                current.Permissions.OrderBy(p => p).ToList(),
                current.ScopeOrganizationIds.ToList()));
        }).RequireAuthorization();

        return app;
    }

    private static CurrentUserDto BuildCurrentUser(ClaimsPrincipal principal, ApplicationUser user)
    {
        var permissions = principal.FindAll(AuthClaims.Permission).Select(c => c.Value).OrderBy(p => p).ToList();
        var scopes = principal.FindAll(AuthClaims.ScopeOrganization)
            .Select(c => Guid.TryParse(c.Value, out var id) ? id : Guid.Empty)
            .Where(id => id != Guid.Empty).ToList();

        return new CurrentUserDto(user.Id, user.Email, user.FullName, user.TenantId, permissions, scopes);
    }
}
