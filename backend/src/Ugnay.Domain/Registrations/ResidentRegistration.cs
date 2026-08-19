using Ugnay.Domain.Audit;
using Ugnay.Domain.Common;
using Ugnay.Domain.Organizations;
using Ugnay.Domain.Residents;

namespace Ugnay.Domain.Registrations;

/// <summary>Registration review lifecycle (spec §12). Registration is never
/// automatically treated as proof of residency — it awaits staff verification.</summary>
public enum RegistrationStatus
{
    Submitted = 1,
    UnderReview = 2,
    Approved = 3,
    Rejected = 4,
}

/// <summary>
/// A self-service resident registration submitted from a barangay public portal
/// (spec §12). Staff review it, optionally match it to an existing resident, and
/// approve (creating/linking a resident) or reject. Distinct from the resident
/// identity it may produce.
/// </summary>
public class ResidentRegistration : BaseEntity, IAuditableEntity
{
    public Guid TenantId { get; set; }

    /// <summary>Barangay the person registered at (from the portal URL, spec §12).</summary>
    public Guid OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    /// <summary>Human-readable reference, e.g. "REG-2026-000001".</summary>
    public required string ReferenceNumber { get; set; }

    // --- Submitted details ---
    public required string FirstName { get; set; }
    public string? MiddleName { get; set; }
    public required string LastName { get; set; }
    public string? Suffix { get; set; }
    public Sex Sex { get; set; } = Sex.Unspecified;
    public DateOnly? BirthDate { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }

    /// <summary>Future: set once an email/SMS one-time code is confirmed (spec §12).</summary>
    public bool ContactVerified { get; set; }

    public RegistrationStatus Status { get; set; } = RegistrationStatus.Submitted;

    /// <summary>Existing resident this registration was matched/linked to, if any.</summary>
    public Guid? MatchedResidentId { get; set; }

    /// <summary>Resident record produced on approval (created or linked).</summary>
    public Guid? ResultResidentId { get; set; }

    public Guid? ReviewedByUserId { get; set; }
    public DateTimeOffset? ReviewedAtUtc { get; set; }
    public string? ReviewRemarks { get; set; }

    public Guid? AuditOrganizationId => OrganizationId;
}
