using Ugnay.Domain.Common;
using Ugnay.Domain.Organizations;

namespace Ugnay.Domain.Authorization;

/// <summary>
/// Defines WHERE a user's roles apply — the organization(s) they operate in
/// (spec §15, §103). Effective capability = permission (via roles) AND the target
/// record's organization falling within one of these scopes.
/// </summary>
public class UserOrganizationScope : BaseEntity
{
    public Guid UserId { get; set; }

    public Guid OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    /// <summary>When true (default), the scope also covers child organizations
    /// (e.g. an LGU scope reaching all its barangays).</summary>
    public bool IncludesDescendants { get; set; } = true;
}
