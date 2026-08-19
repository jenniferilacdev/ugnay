using System.Reflection;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Domain.Audit;
using Ugnay.Domain.Authorization;
using Ugnay.Domain.Common;
using Ugnay.Domain.Households;
using Ugnay.Domain.Officials;
using Ugnay.Domain.Organizations;
using Ugnay.Domain.Requests;
using Ugnay.Domain.Residents;
using Ugnay.Domain.Tenants;
using Ugnay.Infrastructure.Identity;

namespace Ugnay.Infrastructure.Persistence;

/// <summary>
/// The single EF Core context for the modular monolith. Entity mappings live in
/// per-entity <see cref="IEntityTypeConfiguration{TEntity}"/> classes and are
/// discovered by assembly scan, keeping this file stable as modules are added.
///
/// Backed by <see cref="IdentityUserContext{TUser, TKey}"/> so ASP.NET Core
/// Identity manages user accounts (no Identity role tables — UGNAY uses its own
/// permission-based <see cref="Role"/> model, spec §24).
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityUserContext<ApplicationUser, Guid>(options), IAppDbContext
{
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<OrganizationSettings> OrganizationSettings => Set<OrganizationSettings>();
    public DbSet<Purok> Puroks => Set<Purok>();

    public DbSet<Official> Officials => Set<Official>();
    public DbSet<OfficialTerm> OfficialTerms => Set<OfficialTerm>();

    public DbSet<Resident> Residents => Set<Resident>();
    public DbSet<ResidentResidency> ResidentResidencies => Set<ResidentResidency>();
    public DbSet<ReferenceCounter> ReferenceCounters => Set<ReferenceCounter>();

    public DbSet<Household> Households => Set<Household>();
    public DbSet<HouseholdMember> HouseholdMembers => Set<HouseholdMember>();

    public DbSet<Request> Requests => Set<Request>();
    public DbSet<RequestEvent> RequestEvents => Set<RequestEvent>();

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<UserOrganizationScope> UserOrganizationScopes => Set<UserOrganizationScope>();

    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Stamps UTC create/update timestamps automatically (spec §90).</summary>
    private void ApplyAuditTimestamps()
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAtUtc = now;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAtUtc = now;
                    break;
            }
        }
    }
}
