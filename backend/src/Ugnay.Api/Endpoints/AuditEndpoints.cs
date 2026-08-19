using Microsoft.EntityFrameworkCore;
using Ugnay.Api.Auth;
using Ugnay.Api.Configuration;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Domain.Authorization;

namespace Ugnay.Api.Endpoints;

public record AuditLogDto(
    Guid Id, DateTimeOffset TimestampUtc, string? ActorName, string Action,
    string EntityType, string? EntityId, Guid? OrganizationId, string? IpAddress);

/// <summary>
/// Read access to the audit log (spec §74). Requires <c>audit.view</c> and is
/// scoped to the caller's tenant.
/// </summary>
public static class AuditEndpoints
{
    public static IEndpointRouteBuilder MapAuditEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/audit", async (
            int? take, ICurrentUser current, IAppDbContext db, CancellationToken ct) =>
        {
            if (current.TenantId is not { } tenantId)
                return Results.BadRequest(new { message = "No tenant context for this account." });

            var limit = Math.Clamp(take ?? 100, 1, 500);

            var items = await db.AuditLogs
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId)
                .OrderByDescending(a => a.TimestampUtc)
                .Take(limit)
                .Select(a => new AuditLogDto(
                    a.Id, a.TimestampUtc, a.ActorName, a.Action, a.EntityType,
                    a.EntityId, a.OrganizationId, a.IpAddress))
                .ToListAsync(ct);

            return Results.Ok(items);
        })
        .WithTags("Audit")
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.AuditView));

        return app;
    }
}
