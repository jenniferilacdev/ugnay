using Ugnay.Domain.Common;

namespace Ugnay.Domain.Authorization;

/// <summary>
/// A single resource-action capability, e.g. <c>organization.view</c> (spec §24).
/// The catalog is global (not tenant-scoped); see <see cref="Permissions"/>.
/// </summary>
public class Permission : BaseEntity
{
    public required string Key { get; set; }
    public required string Resource { get; set; }
    public required string Action { get; set; }
    public string? Description { get; set; }

    public ICollection<RolePermission> RolePermissions { get; set; } = [];
}
