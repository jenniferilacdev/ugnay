using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Ugnay.Api.Auth;
using Ugnay.Domain.Authorization;
using Ugnay.Domain.Identity;
using Ugnay.Infrastructure.Identity;
using Ugnay.Infrastructure.Persistence;

namespace Ugnay.Api.Configuration;

public static class IdentitySetup
{
    /// <summary>Policy name for a single permission requirement, e.g. "perm:organization.view".</summary>
    public static string PermissionPolicy(string key) => $"perm:{key}";

    public static IServiceCollection AddUgnayIdentity(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddScoped<Ugnay.Application.Common.Interfaces.ICurrentActor, HttpCurrentActor>();
        services.AddScoped<ScopeResolver>();

        services
            .AddIdentityCore<ApplicationUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequiredLength = 8;
                options.Password.RequireNonAlphanumeric = true;
                options.SignIn.RequireConfirmedAccount = false; // Phase 1: email confirmation not yet wired
                options.Lockout.MaxFailedAccessAttempts = 5;
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders()
            .AddClaimsPrincipalFactory<UgnayUserClaimsPrincipalFactory>();

        // Cookie auth. The External / TwoFactor schemes are required by SignInManager.
        services
            .AddAuthentication(IdentityConstants.ApplicationScheme)
            .AddCookie(IdentityConstants.ApplicationScheme, options =>
            {
                options.Cookie.Name = "ugnay.auth";
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest; // dev http; https in prod
                options.ExpireTimeSpan = TimeSpan.FromHours(8);
                options.SlidingExpiration = true;

                // API surface: return status codes, never redirect to a login page.
                options.Events.OnRedirectToLogin = ctx =>
                {
                    ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                };
                options.Events.OnRedirectToAccessDenied = ctx =>
                {
                    ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                };
            })
            .AddCookie(IdentityConstants.ExternalScheme)
            .AddCookie(IdentityConstants.TwoFactorUserIdScheme);

        // One authorization policy per known permission key.
        services.AddAuthorizationBuilder().Setup();

        services.AddAntiforgery(options =>
        {
            options.HeaderName = "X-XSRF-TOKEN";
            options.Cookie.Name = "ugnay.csrf";
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        });

        return services;
    }

    private static void Setup(this AuthorizationBuilder builder)
    {
        foreach (var permission in Permissions.All)
        {
            builder.AddPolicy(PermissionPolicy(permission.Key), policy =>
                policy.RequireClaim(AuthClaims.Permission, permission.Key));
        }
    }
}
