namespace Ugnay.Domain.Authorization;

/// <summary>
/// Authoritative catalog of resource-action permission keys (spec §24).
/// Permissions — not role names — determine capability (spec §102 rule 13).
/// Each phase adds the keys for the resources it introduces; this set covers
/// Phase 1 (organizations, puroks, users, roles, audit).
/// </summary>
public static class Permissions
{
    // Organizations
    public const string OrganizationView = "organization.view";
    public const string OrganizationCreate = "organization.create";
    public const string OrganizationUpdate = "organization.update";
    public const string OrganizationArchive = "organization.archive";

    // Puroks
    public const string PurokView = "purok.view";
    public const string PurokManage = "purok.manage";

    // Officials
    public const string OfficialView = "official.view";
    public const string OfficialCreate = "official.create";
    public const string OfficialUpdate = "official.update";
    public const string OfficialArchive = "official.archive";

    // Requests — reusable workflow engine (spec §31, §37)
    public const string RequestView = "request.view";
    public const string RequestCreate = "request.create";
    public const string RequestReview = "request.review";
    public const string RequestApprove = "request.approve";

    // Households (spec §33)
    public const string HouseholdView = "household.view";
    public const string HouseholdCreate = "household.create";
    public const string HouseholdUpdate = "household.update";
    public const string HouseholdArchive = "household.archive";

    // Residents (spec §25)
    public const string ResidentView = "resident.view";
    public const string ResidentViewSensitive = "resident.view_sensitive";
    public const string ResidentCreate = "resident.create";
    public const string ResidentUpdate = "resident.update";
    public const string ResidentVerify = "resident.verify";
    public const string ResidentArchive = "resident.archive";
    public const string ResidentRestore = "resident.restore";
    public const string ResidentTransfer = "resident.transfer";
    public const string ResidentExport = "resident.export";

    // Users
    public const string UserView = "user.view";
    public const string UserManage = "user.manage";

    // Roles & permissions
    public const string RoleView = "role.view";
    public const string RoleManage = "role.manage";

    // Audit
    public const string AuditView = "audit.view";

    /// <summary>Full catalog with metadata, used to seed the permissions table.</summary>
    public static readonly IReadOnlyList<PermissionDefinition> All =
    [
        new(OrganizationView, "organization", "view", "View organizations and hierarchy"),
        new(OrganizationCreate, "organization", "create", "Create organizations"),
        new(OrganizationUpdate, "organization", "update", "Update organizations"),
        new(OrganizationArchive, "organization", "archive", "Archive/deactivate organizations"),
        new(PurokView, "purok", "view", "View puroks"),
        new(PurokManage, "purok", "manage", "Create and update puroks"),
        new(OfficialView, "official", "view", "View officials"),
        new(OfficialCreate, "official", "create", "Create officials"),
        new(OfficialUpdate, "official", "update", "Update officials"),
        new(OfficialArchive, "official", "archive", "Archive officials"),
        new(RequestView, "request", "view", "View requests"),
        new(RequestCreate, "request", "create", "Create and submit requests"),
        new(RequestReview, "request", "review", "Review, assign, process, and complete requests"),
        new(RequestApprove, "request", "approve", "Approve or reject requests"),
        new(HouseholdView, "household", "view", "View households"),
        new(HouseholdCreate, "household", "create", "Create households"),
        new(HouseholdUpdate, "household", "update", "Update households and members"),
        new(HouseholdArchive, "household", "archive", "Archive households"),
        new(ResidentView, "resident", "view", "View residents"),
        new(ResidentViewSensitive, "resident", "view_sensitive", "View sensitive resident fields"),
        new(ResidentCreate, "resident", "create", "Create residents"),
        new(ResidentUpdate, "resident", "update", "Update residents"),
        new(ResidentVerify, "resident", "verify", "Verify residents"),
        new(ResidentArchive, "resident", "archive", "Archive residents"),
        new(ResidentRestore, "resident", "restore", "Restore archived residents"),
        new(ResidentTransfer, "resident", "transfer", "Transfer residents between barangays"),
        new(ResidentExport, "resident", "export", "Export resident data"),
        new(UserView, "user", "view", "View user accounts"),
        new(UserManage, "user", "manage", "Create, update, and assign users"),
        new(RoleView, "role", "view", "View roles and permissions"),
        new(RoleManage, "role", "manage", "Create and update roles and their permissions"),
        new(AuditView, "audit", "view", "View audit logs"),
    ];
}

public record PermissionDefinition(string Key, string Resource, string Action, string Description);
