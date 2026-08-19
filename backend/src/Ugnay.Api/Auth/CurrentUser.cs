using System.Security.Claims;

namespace Ugnay.Api.Auth;

/// <summary>Convenient, request-scoped view of the authenticated principal's claims.</summary>
public interface ICurrentUser
{
    bool IsAuthenticated { get; }
    Guid? UserId { get; }
    Guid? TenantId { get; }
    IReadOnlySet<string> Permissions { get; }
    IReadOnlySet<Guid> ScopeOrganizationIds { get; }
    bool HasPermission(string permissionKey);
}

public class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => accessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;

    public Guid? UserId =>
        Guid.TryParse(Principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    public Guid? TenantId =>
        Guid.TryParse(Principal?.FindFirstValue(AuthClaims.TenantId), out var id) ? id : null;

    public IReadOnlySet<string> Permissions =>
        Principal?.FindAll(AuthClaims.Permission).Select(c => c.Value).ToHashSet()
        ?? new HashSet<string>();

    public IReadOnlySet<Guid> ScopeOrganizationIds =>
        Principal?.FindAll(AuthClaims.ScopeOrganization)
            .Select(c => Guid.TryParse(c.Value, out var id) ? id : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .ToHashSet()
        ?? new HashSet<Guid>();

    public bool HasPermission(string permissionKey) => Permissions.Contains(permissionKey);
}
