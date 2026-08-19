using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Ugnay.Infrastructure.Persistence;

/// <summary>
/// Design-time factory used by the EF Core CLI (`dotnet ef migrations` / `database update`).
/// Lets migrations run without starting the API. The connection string comes from the
/// UGNAY_DB_CONNECTION environment variable, falling back to the local Docker Postgres.
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("UGNAY_DB_CONNECTION")
            ?? "Host=localhost;Port=5432;Database=ugnay;Username=ugnay;Password=ugnay_dev_password";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString, npgsql => npgsql.MigrationsAssembly(typeof(AppDbContextFactory).Assembly.FullName))
            .UseSnakeCaseNamingConvention()
            .Options;

        return new AppDbContext(options);
    }
}
