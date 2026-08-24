using Ugnay.Domain.Audit;
using Ugnay.Domain.Common;
using Ugnay.Domain.Organizations;

namespace Ugnay.Domain.Tasks;

/// <summary>Internal task lifecycle (spec §57).</summary>
public enum TaskStatus
{
    Open = 1,
    InProgress = 2,
    Done = 3,
    Cancelled = 4,
}

public enum TaskPriority
{
    Low = 1,
    Normal = 2,
    High = 3,
    Urgent = 4,
}

/// <summary>
/// An internal work item for staff (spec §57). Named <c>TaskItem</c> to avoid
/// clashing with <see cref="System.Threading.Tasks.Task"/>. May originate from a
/// request, certificate, concern, etc. via the optional related-record link.
/// </summary>
public class TaskItem : BaseEntity, IAuditableEntity
{
    public Guid TenantId { get; set; }

    public Guid OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    public required string Title { get; set; }
    public string? Notes { get; set; }

    /// <summary>Optional link to the originating record, e.g. "Request".</summary>
    public string? RelatedRecordType { get; set; }
    public Guid? RelatedRecordId { get; set; }

    public Guid? AssignedToUserId { get; set; }

    public TaskPriority Priority { get; set; } = TaskPriority.Normal;
    public DateOnly? DueDate { get; set; }

    public TaskStatus Status { get; set; } = TaskStatus.Open;
    public DateTimeOffset? CompletedAtUtc { get; set; }

    public Guid? AuditOrganizationId => OrganizationId;
}
