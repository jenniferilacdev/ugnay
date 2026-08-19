using Microsoft.EntityFrameworkCore;
using Ugnay.Domain.Tenants;

namespace Ugnay.Application.Common.Interfaces;

/// <summary>
/// Abstraction the Application layer uses to reach persistence, so it never
/// takes a hard dependency on EF Core / Infrastructure (Clean Architecture).
/// Concrete implementation is <c>AppDbContext</c> in Ugnay.Infrastructure.
/// </summary>
public interface IAppDbContext
{
    DbSet<Tenant> Tenants { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
