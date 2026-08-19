namespace Ugnay.Application.Common.Interfaces;

/// <summary>
/// Records important actions that are not simple entity changes — authentication
/// events, exports, approvals, etc. (spec §74). Entity create/update/archive are
/// captured automatically by the audit interceptor.
/// </summary>
public interface IAuditWriter
{
    Task WriteAsync(
        string action,
        string entityType,
        string? entityId = null,
        Guid? organizationId = null,
        object? changes = null,
        CancellationToken cancellationToken = default);
}
