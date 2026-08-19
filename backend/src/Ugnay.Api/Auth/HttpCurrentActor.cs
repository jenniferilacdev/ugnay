using System.Security.Claims;
using Ugnay.Application.Common.Interfaces;

namespace Ugnay.Api.Auth;

/// <summary>HttpContext-backed <see cref="ICurrentActor"/> for audit attribution.</summary>
public class HttpCurrentActor(IHttpContextAccessor accessor) : ICurrentActor
{
    private ClaimsPrincipal? User => accessor.HttpContext?.User;

    public Guid? UserId =>
        Guid.TryParse(User?.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    public string? Name => User?.FindFirstValue("name") ?? User?.Identity?.Name;

    public Guid? TenantId =>
        Guid.TryParse(User?.FindFirstValue(AuthClaims.TenantId), out var id) ? id : null;

    public string? IpAddress =>
        accessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
}
