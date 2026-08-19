using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Infrastructure.Audit;
using Ugnay.Infrastructure.Common;
using Ugnay.Infrastructure.Persistence;
using Ugnay.Infrastructure.Persistence.Interceptors;

namespace Ugnay.Infrastructure;

/// <summary>
/// Infrastructure-layer service registration: EF Core / PostgreSQL and the
/// persistence abstractions the Application layer depends on.
/// </summary>
public static class DependencyInjection
{
    public const string DefaultConnectionName = "Default";

    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString(DefaultConnectionName)
            ?? throw new InvalidOperationException(
                $"Connection string '{DefaultConnectionName}' was not found. " +
                "Set ConnectionStrings__Default (see .env.example).");

        services.AddScoped<AuditSaveChangesInterceptor>();

        services.AddDbContext<AppDbContext>((sp, options) =>
            options
                .UseNpgsql(connectionString, npgsql =>
                    npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName))
                .UseSnakeCaseNamingConvention()
                .AddInterceptors(sp.GetRequiredService<AuditSaveChangesInterceptor>()));

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<IAuditWriter, AuditWriter>();
        services.AddScoped<IReferenceNumberGenerator, ReferenceNumberGenerator>();

        return services;
    }
}
