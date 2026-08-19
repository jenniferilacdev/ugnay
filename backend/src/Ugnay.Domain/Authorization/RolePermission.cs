namespace Ugnay.Domain.Authorization;

/// <summary>Join: which permissions a role grants (spec §100).</summary>
public class RolePermission
{
    public Guid RoleId { get; set; }
    public Role? Role { get; set; }

    public Guid PermissionId { get; set; }
    public Permission? Permission { get; set; }
}
