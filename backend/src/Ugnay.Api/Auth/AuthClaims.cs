namespace Ugnay.Api.Auth;

/// <summary>Custom claim types UGNAY stamps into the auth cookie.</summary>
public static class AuthClaims
{
    /// <summary>One claim per granted permission key (e.g. "organization.view").</summary>
    public const string Permission = "ugnay:permission";

    /// <summary>One claim per organization id the user is scoped to (spec §15).</summary>
    public const string ScopeOrganization = "ugnay:scope_org";

    /// <summary>The user's tenant id (absent for platform-level accounts).</summary>
    public const string TenantId = "ugnay:tenant";
}
