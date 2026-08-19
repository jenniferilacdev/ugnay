using Ugnay.Domain.Common;

namespace Ugnay.Domain.Authorization;

/// <summary>
/// A named bundle of permissions (spec §16). Roles are templates; permissions
/// remain authoritative. System roles (<see cref="IsSystem"/>) are the seeded
/// defaults; tenants may later define their own custom roles (spec §73).
/// </summary>
public class Role : BaseEntity
{
    /// <summary>Owning tenant; null for platform/system role templates.</summary>
    public Guid? TenantId { get; set; }

    /// <summary>Stable machine key, e.g. "barangay-admin".</summary>
    public required string Key { get; set; }

    public required string Name { get; set; }
    public string? Description { get; set; }

    /// <summary>Seeded default that ordinary admins cannot delete.</summary>
    public bool IsSystem { get; set; }

    public ICollection<RolePermission> RolePermissions { get; set; } = [];
}
