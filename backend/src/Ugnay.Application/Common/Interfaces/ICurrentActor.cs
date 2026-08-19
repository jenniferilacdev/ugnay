namespace Ugnay.Application.Common.Interfaces;

/// <summary>
/// The acting principal, abstracted so lower layers (audit) can attribute actions
/// without depending on ASP.NET Core / HttpContext. Implemented in the API layer.
/// </summary>
public interface ICurrentActor
{
    Guid? UserId { get; }
    string? Name { get; }
    Guid? TenantId { get; }
    string? IpAddress { get; }
}
