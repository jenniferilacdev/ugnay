using Ugnay.Domain.Audit;
using Ugnay.Domain.Common;
using Ugnay.Domain.Residents;

namespace Ugnay.Domain.Assistance;

/// <summary>
/// A social-assistance program a resident can be enrolled in (spec §43), e.g.
/// "4Ps" / Pantawid Pamilyang Pilipino. A simple per-tenant lookup of code + name.
/// </summary>
public class AssistanceProgram : BaseEntity, IAuditableEntity
{
    public Guid TenantId { get; set; }

    /// <summary>Short code, unique within the tenant, e.g. "4Ps".</summary>
    public required string Code { get; set; }

    public required string Name { get; set; }

    public Guid? AuditOrganizationId => null;
}

/// <summary>Join: which assistance programs a resident is enrolled in.</summary>
public class ResidentAssistanceProgram
{
    public Guid ResidentId { get; set; }
    public Resident? Resident { get; set; }

    public Guid AssistanceProgramId { get; set; }
    public AssistanceProgram? AssistanceProgram { get; set; }
}
