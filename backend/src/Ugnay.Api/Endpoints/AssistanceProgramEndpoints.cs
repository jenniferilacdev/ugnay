using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;
using Ugnay.Api.Auth;
using Ugnay.Api.Configuration;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Domain.Assistance;
using Ugnay.Domain.Authorization;

namespace Ugnay.Api.Endpoints;

public record AssistanceProgramDto(Guid Id, string Code, string Name);
public record CreateAssistanceProgramDto(string Code, string Name);

/// <summary>
/// Social-assistance program lookup (spec §43). Reads require <c>assistance.view</c>;
/// managing the list requires <c>assistance.manage</c>. Tenant-scoped.
/// </summary>
public static class AssistanceProgramEndpoints
{
    public static IEndpointRouteBuilder MapAssistanceProgramEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/assistance-programs").WithTags("Assistance");

        group.MapGet("/", async (ICurrentUser current, IAppDbContext db, CancellationToken ct) =>
        {
            var items = await db.AssistancePrograms
                .AsNoTracking()
                .Where(p => p.TenantId == current.TenantId)
                .OrderBy(p => p.Code)
                .Select(p => new AssistanceProgramDto(p.Id, p.Code, p.Name))
                .ToListAsync(ct);
            return Results.Ok(items);
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.AssistanceView));

        group.MapPost("/", async (
            CreateAssistanceProgramDto request, ICurrentUser current, IAntiforgery antiforgery,
            IAppDbContext db, HttpContext http, CancellationToken ct) =>
        {
            if (await CsrfError(antiforgery, http) is { } bad) return bad;
            if (string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Name))
                return Results.BadRequest(new { message = "Code and name are required." });

            var tenantId = current.TenantId!.Value;
            var exists = await db.AssistancePrograms.AnyAsync(
                p => p.TenantId == tenantId && p.Code == request.Code, ct);
            if (exists)
                return Results.Conflict(new { message = "A program with that code already exists." });

            var program = new AssistanceProgram
            {
                TenantId = tenantId,
                Code = request.Code.Trim(),
                Name = request.Name.Trim(),
            };
            db.AssistancePrograms.Add(program);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/assistance-programs/{program.Id}",
                new AssistanceProgramDto(program.Id, program.Code, program.Name));
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.AssistanceManage));

        group.MapPost("/{id:guid}/remove", async (
            Guid id, ICurrentUser current, IAntiforgery antiforgery, IAppDbContext db,
            HttpContext http, CancellationToken ct) =>
        {
            if (await CsrfError(antiforgery, http) is { } bad) return bad;

            var program = await db.AssistancePrograms.FirstOrDefaultAsync(
                p => p.Id == id && p.TenantId == current.TenantId, ct);
            if (program is null) return Results.NotFound(new { message = "Program not found." });

            db.AssistancePrograms.Remove(program);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.AssistanceManage));

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
