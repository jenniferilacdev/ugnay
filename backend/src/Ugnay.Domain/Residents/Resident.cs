using Ugnay.Domain.Audit;
using Ugnay.Domain.Common;

namespace Ugnay.Domain.Residents;

/// <summary>
/// A resident identity (spec §11, §32). Distinct from the user account (which is
/// permanent) and from residency (which changes over time). Archived, never
/// hard-deleted (spec §30).
/// </summary>
public class Resident : BaseEntity, IAuditableEntity
{
    public Guid TenantId { get; set; }

    /// <summary>Human-readable reference, e.g. "RES-2026-000001" (spec §41, §90).</summary>
    public required string ReferenceNumber { get; set; }

    // --- Personal information (spec §32) ---
    public required string FirstName { get; set; }
    public string? MiddleName { get; set; }
    public required string LastName { get; set; }
    public string? Suffix { get; set; }

    public Sex Sex { get; set; } = Sex.Unspecified;
    public DateOnly? BirthDate { get; set; }
    public string? BirthPlace { get; set; }
    public CivilStatus CivilStatus { get; set; } = CivilStatus.Single;

    public string? Occupation { get; set; }
    public string? Education { get; set; }

    // --- Contact (sensitive, spec §25 view_sensitive) ---
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }

    public string? PhotoUrl { get; set; }

    // --- Verification (spec §13) ---
    public VerificationStatus VerificationStatus { get; set; } = VerificationStatus.Pending;
    public Guid? VerifiedByUserId { get; set; }
    public DateTimeOffset? VerifiedAtUtc { get; set; }
    public string? VerificationMethod { get; set; }
    public string? VerificationRemarks { get; set; }

    // --- Status / archival (spec §30) ---
    public ResidentStatus Status { get; set; } = ResidentStatus.Active;
    public string? ArchivedReason { get; set; }
    public DateTimeOffset? ArchivedAtUtc { get; set; }

    /// <summary>Denormalized current barangay for scope filtering; residency
    /// history lives in <see cref="Residencies"/>.</summary>
    public Guid? CurrentOrganizationId { get; set; }

    public ICollection<ResidentResidency> Residencies { get; set; } = [];

    public Guid? AuditOrganizationId => CurrentOrganizationId;

    public string FullName =>
        string.Join(" ", new[] { FirstName, MiddleName, LastName, Suffix }
            .Where(p => !string.IsNullOrWhiteSpace(p)));
}
