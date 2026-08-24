using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Ugnay.Api.Configuration;
using Ugnay.Api.Endpoints;
using Ugnay.Application;
using Ugnay.Application.Common.Interfaces;
using Ugnay.Infrastructure;
using Ugnay.Infrastructure.Identity;
using Ugnay.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// --- Logging (Serilog, configured from appsettings) -------------------------
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext());

// --- Services ---------------------------------------------------------------
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddUgnayIdentity();

builder.Services.AddProblemDetails();

builder.Services.AddOpenApi();

builder.Services.AddHealthChecks()
    .AddNpgSql(
        builder.Configuration.GetConnectionString(Ugnay.Infrastructure.DependencyInjection.DefaultConnectionName)!,
        name: "postgres",
        tags: ["ready"]);

const string FrontendCors = "frontend";
builder.Services.AddCors(options => options.AddPolicy(FrontendCors, policy =>
{
    var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                  ?? ["http://localhost:3002"];
    policy.WithOrigins(origins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
}));

var app = builder.Build();

// --- Pipeline ---------------------------------------------------------------
app.UseExceptionHandler();      // returns ProblemDetails, no stack traces leaked (spec §91)
app.UseStatusCodePages();

app.UseSerilogRequestLogging();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    // Apply pending migrations at startup so `docker compose up` + `dotnet run`
    // gives a ready database with no manual step. Production applies migrations
    // as an explicit deploy step, never implicitly.
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await context.Database.MigrateAsync();
    await DevDataSeeder.SeedAsync(context);

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    await IdentitySeeder.SeedAsync(context, userManager, seedDevSuperAdmin: true);
}

app.UseCors(FrontendCors);

app.UseAuthentication();
app.UseAuthorization();
app.UseAntiforgery();

// Liveness: is the process up? Readiness: can it reach its dependencies?
app.MapHealthChecks("/health/live", new() { Predicate = _ => false });
app.MapHealthChecks("/health/ready");

app.MapGet("/api/info", (IWebHostEnvironment env) => Results.Ok(new
{
    name = "UGNAY API",
    description = "Integrated Local Government Information, Operations & Resident Services Platform",
    environment = env.EnvironmentName,
    version = "0.1.0-phase1",
    utc = DateTimeOffset.UtcNow
}));

app.MapGet("/api/tenants", async (IAppDbContext db, CancellationToken ct) =>
    Results.Ok(await db.Tenants
        .AsNoTracking()
        .OrderBy(t => t.Name)
        .Select(t => new { t.Id, t.Name, t.Slug, t.IsActive })
        .ToListAsync(ct)));

app.MapAuthEndpoints();
app.MapOrganizationEndpoints();
app.MapOfficialEndpoints();
app.MapResidentEndpoints();
app.MapAssistanceProgramEndpoints();
app.MapHouseholdEndpoints();
app.MapRequestEndpoints();
app.MapTaskEndpoints();
app.MapUserEndpoints();
app.MapAuditEndpoints();

app.Run();
