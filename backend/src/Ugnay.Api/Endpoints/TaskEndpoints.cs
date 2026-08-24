using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Ugnay.Api.Auth;
using Ugnay.Api.Configuration;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Domain.Authorization;
using Ugnay.Domain.Tasks;
using Ugnay.Infrastructure.Identity;
using TaskStatus = Ugnay.Domain.Tasks.TaskStatus;

namespace Ugnay.Api.Endpoints;

// --- DTOs -------------------------------------------------------------------

public record TaskDto(
    Guid Id, string Title, string? Notes, string Status, string Priority,
    DateOnly? DueDate, Guid? AssignedToUserId, string? AssignedToName,
    string? RelatedRecordType, Guid? RelatedRecordId, DateTimeOffset CreatedAtUtc);

public record CreateTaskDto(
    Guid OrganizationId, string Title, string? Notes, string? Priority, DateOnly? DueDate,
    Guid? AssignedToUserId, string? RelatedRecordType, Guid? RelatedRecordId);

public record UpdateTaskDto(
    string? Status, string? Priority, DateOnly? DueDate, Guid? AssignedToUserId, string? Notes);

/// <summary>
/// Internal task management (spec §57). Reads require <c>task.view</c>; create
/// requires <c>task.create</c>; updates require <c>task.update</c>. All writes are
/// CSRF-protected and organization-scope enforced.
/// </summary>
public static class TaskEndpoints
{
    public static IEndpointRouteBuilder MapTaskEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tasks").WithTags("Tasks");

        // GET /api/tasks?status=&mine=true
        group.MapGet("/", async (
            string? status, bool? mine, ICurrentUser current, ScopeResolver scope,
            UserManager<ApplicationUser> userManager, IAppDbContext db, CancellationToken ct) =>
        {
            var visible = await scope.VisibleOrganizationIdsAsync(ct: ct);
            if (visible.Count == 0) return Results.Ok(Array.Empty<TaskDto>());

            var query = db.Tasks.AsNoTracking().Where(t => visible.Contains(t.OrganizationId));

            if (Enum.TryParse<TaskStatus>(status, true, out var s))
                query = query.Where(t => t.Status == s);
            if (mine == true && current.UserId is { } uid)
                query = query.Where(t => t.AssignedToUserId == uid);

            var tasks = await query
                .OrderBy(t => t.Status).ThenByDescending(t => t.CreatedAtUtc)
                .ToListAsync(ct);

            var names = await AssigneeNamesAsync(userManager, tasks.Select(t => t.AssignedToUserId), ct);

            var items = tasks.Select(t => Map(t, names)).ToList();
            return Results.Ok(items);
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.TaskView));

        // POST /api/tasks
        group.MapPost("/", async (
            CreateTaskDto request, ScopeResolver scope, ICurrentUser current,
            IAntiforgery antiforgery, IAppDbContext db, HttpContext http, CancellationToken ct) =>
        {
            if (await CsrfError(antiforgery, http) is { } bad) return bad;
            if (string.IsNullOrWhiteSpace(request.Title))
                return Results.BadRequest(new { message = "Title is required." });

            var visible = await scope.VisibleOrganizationIdsAsync(ct: ct);
            if (!visible.Contains(request.OrganizationId))
                return Results.Json(new { message = "Organization is outside your scope." },
                    statusCode: StatusCodes.Status403Forbidden);

            var task = new TaskItem
            {
                TenantId = current.TenantId!.Value,
                OrganizationId = request.OrganizationId,
                Title = request.Title.Trim(),
                Notes = request.Notes,
                Priority = Enum.TryParse<TaskPriority>(request.Priority, true, out var p) ? p : TaskPriority.Normal,
                DueDate = request.DueDate,
                AssignedToUserId = request.AssignedToUserId,
                RelatedRecordType = request.RelatedRecordType,
                RelatedRecordId = request.RelatedRecordId,
            };

            db.Tasks.Add(task);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/tasks/{task.Id}", new { task.Id });
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.TaskCreate));

        // POST /api/tasks/{id}/update
        group.MapPost("/{id:guid}/update", async (
            Guid id, UpdateTaskDto request, ScopeResolver scope, IAntiforgery antiforgery,
            IAppDbContext db, HttpContext http, CancellationToken ct) =>
        {
            if (await CsrfError(antiforgery, http) is { } bad) return bad;

            var visible = await scope.VisibleOrganizationIdsAsync(ct: ct);
            var task = await db.Tasks.FirstOrDefaultAsync(t => t.Id == id, ct);
            if (task is null || !visible.Contains(task.OrganizationId))
                return Results.NotFound(new { message = "Task not found." });

            if (Enum.TryParse<TaskStatus>(request.Status, true, out var status))
            {
                task.Status = status;
                task.CompletedAtUtc = status == TaskStatus.Done ? DateTimeOffset.UtcNow : null;
            }
            if (Enum.TryParse<TaskPriority>(request.Priority, true, out var priority))
                task.Priority = priority;
            if (request.DueDate is not null) task.DueDate = request.DueDate;
            if (request.AssignedToUserId is not null) task.AssignedToUserId = request.AssignedToUserId;
            if (request.Notes is not null) task.Notes = request.Notes;

            await db.SaveChangesAsync(ct);
            return Results.Ok(new { task.Id, Status = task.Status.ToString() });
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.TaskUpdate));

        return app;
    }

    private static async Task<Dictionary<Guid, string?>> AssigneeNamesAsync(
        UserManager<ApplicationUser> userManager, IEnumerable<Guid?> ids, CancellationToken ct)
    {
        var wanted = ids.Where(i => i is not null).Select(i => i!.Value).Distinct().ToList();
        if (wanted.Count == 0) return [];
        return await userManager.Users.AsNoTracking()
            .Where(u => wanted.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FullName ?? u.Email, ct);
    }

    private static TaskDto Map(TaskItem t, IReadOnlyDictionary<Guid, string?> names) => new(
        t.Id, t.Title, t.Notes, t.Status.ToString(), t.Priority.ToString(), t.DueDate,
        t.AssignedToUserId,
        t.AssignedToUserId is { } uid && names.TryGetValue(uid, out var n) ? n : null,
        t.RelatedRecordType, t.RelatedRecordId, t.CreatedAtUtc);

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
