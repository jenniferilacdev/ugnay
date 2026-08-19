using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Domain.Common;
using Ugnay.Domain.Tenants;

namespace Ugnay.Infrastructure.Persistence;

/// <summary>
/// The single EF Core context for the modular monolith. Entity mappings live in
/// per-entity <see cref="IEntityTypeConfiguration{TEntity}"/> classes and are
/// discovered by assembly scan, keeping this file stable as modules are added.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options)
    : DbContext(options), IAppDbContext
{
    public DbSet<Tenant> Tenants => Set<Tenant>();

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
