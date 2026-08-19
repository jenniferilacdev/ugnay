using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;
using Ugnay.Api.Auth;
using Ugnay.Api.Configuration;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Domain.Authorization;
using Ugnay.Domain.Requests;

namespace Ugnay.Api.Endpoints;

// --- DTOs -------------------------------------------------------------------

public record RequestSummaryDto(
    Guid Id, string ReferenceNumber, string Category, string Title, string Status,
    string Priority, string? Resident, DateTimeOffset CreatedAtUtc);

public record RequestEventDto(
    Guid Id, string Type, string? FromStatus, string? ToStatus, string? ActorName,
    string? Remarks, DateTimeOffset CreatedAtUtc);

public record RequestDetailDto(
    Guid Id, string ReferenceNumber, string Category, string Title, string? Description,
    string Status, string Priority, string Organization, string? Resident,
    Guid? AssignedToUserId, DateTimeOffset CreatedAtUtc, DateTimeOffset? CompletedAtUtc,
    IReadOnlyList<string> AvailableActions, IReadOnlyList<RequestEventDto> Timeline);

public record CreateRequestDto(
    Guid OrganizationId, string Category, string Title, string? Description,
    Guid? RequestedByResidentId, string? Priority);

public record TransitionRequestDto(string Action, string? Remarks, Guid? AssignedToUserId);

/// <summary>
/// The reusable request/approval workflow (spec §31, §37). Reads require
/// <c>request.view</c>; creation requires <c>request.create</c>; transitions check
/// the permission the workflow demands for each action. All writes are
/// CSRF-protected, organization-scope enforced, and recorded on the timeline.
/// </summary>
public static class RequestEndpoints
{
    // Actions a caller with the given permissions may take from a status (for the UI).
    private static readonly string[] AllActions =
        ["review", "approve", "reject", "start", "complete", "cancel"];

    public static IEndpointRouteBuilder MapRequestEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/requests").WithTags("Requests");

        // GET /api/requests?status=&category=
        group.MapGet("/", async (
            string? status, string? category, ScopeResolver scope, IAppDbContext db, CancellationToken ct) =>
        {
            var visible = await scope.VisibleOrganizationIdsAsync(ct);
            if (visible.Count == 0) return Results.Ok(Array.Empty<RequestSummaryDto>());

            var query = db.Requests.AsNoTracking().Where(r => visible.Contains(r.OrganizationId));

            if (Enum.TryParse<RequestStatus>(status, true, out var s))
                query = query.Where(r => r.Status == s);
            if (Enum.TryParse<RequestCategory>(category, true, out var c))
                query = query.Where(r => r.Category == c);

            var items = await query
                .OrderByDescending(r => r.CreatedAtUtc)
                .Select(r => new RequestSummaryDto(
                    r.Id, r.ReferenceNumber, r.Category.ToString(), r.Title, r.Status.ToString(),
                    r.Priority.ToString(),
                    db.Residents.Where(x => x.Id == r.RequestedByResidentId)
                        .Select(x => x.FirstName + " " + x.LastName).FirstOrDefault(),
                    r.CreatedAtUtc))
                .ToListAsync(ct);

            return Results.Ok(items);
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.RequestView));

        // GET /api/requests/{id}
        group.MapGet("/{id:guid}", async (
            Guid id, ICurrentUser current, ScopeResolver scope, IAppDbContext db, CancellationToken ct) =>
        {
            var visible = await scope.VisibleOrganizationIdsAsync(ct);

            var req = await db.Requests.AsNoTracking()
                .Include(r => r.Organization)
                .Include(r => r.Events)
                .FirstOrDefaultAsync(r => r.Id == id, ct);
            if (req is null || !visible.Contains(req.OrganizationId))
                return Results.NotFound(new { message = "Request not found." });

            var resident = req.RequestedByResidentId is { } rid
                ? await db.Residents.AsNoTracking().Where(x => x.Id == rid)
                    .Select(x => x.FirstName + " " + x.LastName).FirstOrDefaultAsync(ct)
                : null;

            // Actions the current caller may actually take from this status.
            var actions = AllActions
                .Where(a => RequestWorkflow.TryResolve(a, req.Status, out var t)
                            && current.HasPermission(t!.RequiredPermission))
                .ToList();

            var dto = new RequestDetailDto(
                req.Id, req.ReferenceNumber, req.Category.ToString(), req.Title, req.Description,
                req.Status.ToString(), req.Priority.ToString(), req.Organization?.Name ?? "",
                resident, req.AssignedToUserId, req.CreatedAtUtc, req.CompletedAtUtc, actions,
                req.Events.OrderBy(e => e.CreatedAtUtc)
                    .Select(e => new RequestEventDto(
                        e.Id, e.Type.ToString(), e.FromStatus?.ToString(), e.ToStatus?.ToString(),
                        e.ActorName, e.Remarks, e.CreatedAtUtc))
                    .ToList());

            return Results.Ok(dto);
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.RequestView));

        // POST /api/requests
        group.MapPost("/", async (
            CreateRequestDto request, ScopeResolver scope, ICurrentUser current, ICurrentActor actor,
            IReferenceNumberGenerator numbers, IAntiforgery antiforgery, IAppDbContext db,
            HttpContext http, CancellationToken ct) =>
        {
            if (await CsrfError(antiforgery, http) is { } bad) return bad;

            if (string.IsNullOrWhiteSpace(request.Title))
                return Results.BadRequest(new { message = "Title is required." });
            if (!Enum.TryParse<RequestCategory>(request.Category, true, out var category))
                return Results.BadRequest(new { message = "Invalid category." });

            var visible = await scope.VisibleOrganizationIdsAsync(ct);
            if (!visible.Contains(request.OrganizationId))
                return Results.Json(new { message = "Organization is outside your scope." },
                    statusCode: StatusCodes.Status403Forbidden);

            var tenantId = current.TenantId!.Value;
            var req = new Request
            {
                TenantId = tenantId,
                OrganizationId = request.OrganizationId,
                ReferenceNumber = await numbers.NextAsync(tenantId, "REQ", ct),
                Category = category,
                Title = request.Title.Trim(),
                Description = request.Description,
                RequestedByResidentId = request.RequestedByResidentId,
                Priority = Enum.TryParse<RequestPriority>(request.Priority, true, out var p) ? p : RequestPriority.Normal,
                Status = RequestStatus.Submitted,
                Events =
                {
                    NewEvent(RequestEventType.Created, null, null, actor, request.OrganizationId, null),
                    NewEvent(RequestEventType.Submitted, RequestStatus.Draft, RequestStatus.Submitted,
                        actor, request.OrganizationId, null),
                },
            };

            db.Requests.Add(req);
            await db.SaveChangesAsync(ct);

            return Results.Created($"/api/requests/{req.Id}", new { req.Id, req.ReferenceNumber });
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.RequestCreate));

        // POST /api/requests/{id}/transition
        group.MapPost("/{id:guid}/transition", async (
            Guid id, TransitionRequestDto body, ScopeResolver scope, ICurrentUser current,
            ICurrentActor actor, IAntiforgery antiforgery, IAppDbContext db, HttpContext http,
            CancellationToken ct) =>
        {
            if (await CsrfError(antiforgery, http) is { } bad) return bad;

            var visible = await scope.VisibleOrganizationIdsAsync(ct);
            var req = await db.Requests.Include(r => r.Events).FirstOrDefaultAsync(r => r.Id == id, ct);
            if (req is null || !visible.Contains(req.OrganizationId))
                return Results.NotFound(new { message = "Request not found." });

            var action = body.Action?.Trim().ToLowerInvariant();

            // Assignment does not change status (spec §57 hand-off).
            if (action == "assign")
            {
                if (!current.HasPermission(Permissions.RequestReview))
                    return Results.Json(new { message = "Not permitted." }, statusCode: StatusCodes.Status403Forbidden);

                req.AssignedToUserId = body.AssignedToUserId;
                AddEvent(db, req.Id, RequestEventType.Assigned, req.Status, req.Status, actor,
                    req.OrganizationId, body.Remarks);
                await db.SaveChangesAsync(ct);
                return Results.Ok(new { req.Id, Status = req.Status.ToString() });
            }

            if (!RequestWorkflow.TryResolve(action ?? "", req.Status, out var transition))
                return Results.BadRequest(new { message = $"Action '{action}' is not valid from {req.Status}." });

            if (!current.HasPermission(transition!.RequiredPermission))
                return Results.Json(new { message = "Not permitted." }, statusCode: StatusCodes.Status403Forbidden);

            var from = req.Status;
            req.Status = transition.To;
            if (transition.To == RequestStatus.Completed)
                req.CompletedAtUtc = DateTimeOffset.UtcNow;

            AddEvent(db, req.Id, transition.EventType, from, transition.To, actor,
                req.OrganizationId, body.Remarks);

            await db.SaveChangesAsync(ct);
            return Results.Ok(new { req.Id, Status = req.Status.ToString() });
        })
        .RequireAuthorization(IdentitySetup.PermissionPolicy(Permissions.RequestView));

        return app;
    }

    private static RequestEvent NewEvent(
        RequestEventType type, RequestStatus? from, RequestStatus? to, ICurrentActor actor,
        Guid organizationId, string? remarks) => new()
    {
        Type = type,
        FromStatus = from,
        ToStatus = to,
        ActorUserId = actor.UserId,
        ActorName = actor.Name,
        OrganizationId = organizationId,
        Remarks = remarks,
    };

    // Add an event to an already-tracked request via the DbSet so EF marks it
    // Added (INSERT) rather than issuing a full-column UPDATE on the navigation.
    private static void AddEvent(
        IAppDbContext db, Guid requestId, RequestEventType type, RequestStatus? from,
        RequestStatus? to, ICurrentActor actor, Guid organizationId, string? remarks)
    {
        var ev = NewEvent(type, from, to, actor, organizationId, remarks);
        ev.RequestId = requestId;
        db.RequestEvents.Add(ev);
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
