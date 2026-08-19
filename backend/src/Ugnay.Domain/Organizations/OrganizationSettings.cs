using Ugnay.Domain.Common;

namespace Ugnay.Domain.Organizations;

/// <summary>
/// Per-organization configuration and branding (spec §8). LGU-specific behavior
/// must come from configuration, never hard-coded (spec §8, §102 rule 11).
/// One-to-one with <see cref="Organization"/>.
/// </summary>
public class OrganizationSettings : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    public string? Province { get; set; }
    public string? Region { get; set; }
    public string? Address { get; set; }

    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }

    /// <summary>Storage reference (not the binary) for the logo/seal (spec §75).</summary>
    public string? LogoUrl { get; set; }
    public string? SealUrl { get; set; }

    /// <summary>IANA timezone id; timestamps are stored UTC and displayed here (spec §90).</summary>
    public string Timezone { get; set; } = "Asia/Manila";

    /// <summary>Public-facing portal name; falls back to the organization name when null.</summary>
    public string? PortalName { get; set; }
}
