using Ugnay.Domain.Common;

namespace Ugnay.Domain.Tenants;

/// <summary>
/// Root of the multi-tenant hierarchy (spec §6). A tenant maps to one LGU
/// (municipality / city) today; the model is deliberately kept isolation-ready
/// so a single deployment can later host multiple LGUs.
///
/// This is the only entity seeded in the Phase 0 foundation. The Organization,
/// Identity, Resident, and Household models are introduced in Phase 1 migrations.
/// </summary>
public class Tenant : BaseEntity
{
    /// <summary>Human-readable display name, e.g. "Tuguegarao City".</summary>
    public required string Name { get; set; }

    /// <summary>URL-safe unique key used in portal routing, e.g. "tuguegarao".</summary>
    public required string Slug { get; set; }

    /// <summary>Soft on/off switch. Tenants are never hard-deleted (spec §30).</summary>
    public bool IsActive { get; set; } = true;
}
