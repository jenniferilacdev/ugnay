using Microsoft.EntityFrameworkCore;
using Ugnay.Domain.Assistance;
using Ugnay.Domain.Audit;
using Ugnay.Domain.Authorization;
using Ugnay.Domain.Common;
using Ugnay.Domain.Households;
using Ugnay.Domain.Officials;
using Ugnay.Domain.Organizations;
using Ugnay.Domain.Requests;
using Ugnay.Domain.Residents;
using Ugnay.Domain.Tasks;
using Ugnay.Domain.Tenants;

namespace Ugnay.Application.Common.Interfaces;

/// <summary>
/// Abstraction the Application layer uses to reach persistence, so it never
/// takes a hard dependency on EF Core / Infrastructure (Clean Architecture).
/// Concrete implementation is <c>AppDbContext</c> in Ugnay.Infrastructure.
/// (User accounts are reached via ASP.NET Core Identity's UserManager, not here.)
/// </summary>
public interface IAppDbContext
{
    DbSet<Tenant> Tenants { get; }
    DbSet<Organization> Organizations { get; }
    DbSet<OrganizationSettings> OrganizationSettings { get; }
    DbSet<Purok> Puroks { get; }

    DbSet<Official> Officials { get; }
    DbSet<OfficialTerm> OfficialTerms { get; }

    DbSet<Resident> Residents { get; }
    DbSet<ResidentResidency> ResidentResidencies { get; }
    DbSet<AssistanceProgram> AssistancePrograms { get; }
    DbSet<ResidentAssistanceProgram> ResidentAssistancePrograms { get; }

    DbSet<Household> Households { get; }
    DbSet<HouseholdMember> HouseholdMembers { get; }

    DbSet<Request> Requests { get; }
    DbSet<RequestEvent> RequestEvents { get; }

    DbSet<TaskItem> Tasks { get; }

    DbSet<Role> Roles { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<RolePermission> RolePermissions { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<UserOrganizationScope> UserOrganizationScopes { get; }

    DbSet<AuditLog> AuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
