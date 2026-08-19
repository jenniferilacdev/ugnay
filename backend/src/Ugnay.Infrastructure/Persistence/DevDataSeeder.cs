using Microsoft.EntityFrameworkCore;
using Ugnay.Domain.Organizations;
using Ugnay.Domain.Tenants;

namespace Ugnay.Infrastructure.Persistence;

/// <summary>
/// Idempotent development-only seed data: a province tenant with a small
/// organization hierarchy (province → city → barangays → puroks) so the app has
/// something to display. Safe to run repeatedly; only inserts what is missing.
/// Never runs in Production.
/// </summary>
public static class DevDataSeeder
{
    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        // --- Tenant (province deployment) -----------------------------------
        var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Slug == "cagayan", ct);
        if (tenant is null)
        {
            tenant = new Tenant { Name = "Province of Cagayan", Slug = "cagayan", IsActive = true };
            db.Tenants.Add(tenant);
            await db.SaveChangesAsync(ct);
        }

        // --- Top-level Province ---------------------------------------------
        var province = await db.Organizations
            .FirstOrDefaultAsync(o => o.TenantId == tenant.Id && o.Slug == "cagayan", ct);
        if (province is null)
        {
            province = new Organization
            {
                TenantId = tenant.Id,
                Type = OrganizationType.Province,
                Code = "PROV-CAG",
                Slug = "cagayan",
                Name = "Province of Cagayan",
                Settings = new OrganizationSettings
                {
                    Province = "Cagayan",
                    Region = "Region II (Cagayan Valley)",
                    Timezone = "Asia/Manila",
                },
            };
            db.Organizations.Add(province);
            await db.SaveChangesAsync(ct);
        }

        // --- City under the province ----------------------------------------
        var city = await db.Organizations
            .FirstOrDefaultAsync(o => o.TenantId == tenant.Id && o.Slug == "tuguegarao", ct);
        if (city is null)
        {
            city = new Organization
            {
                TenantId = tenant.Id,
                ParentOrganizationId = province.Id,
                Type = OrganizationType.City,
                Code = "CITY-TUG",
                Slug = "tuguegarao",
                Name = "Tuguegarao City",
                Settings = new OrganizationSettings
                {
                    Province = "Cagayan",
                    Region = "Region II (Cagayan Valley)",
                    Timezone = "Asia/Manila",
                },
            };
            db.Organizations.Add(city);
            await db.SaveChangesAsync(ct);
        }

        // --- Barangays + puroks ---------------------------------------------
        var barangays = new (string Slug, string Code, string Name, int Puroks)[]
        {
            ("ugac-sur", "BRGY-UGAC-SUR", "Ugac Sur", 4),
            ("centro-01", "BRGY-CENTRO-01", "Centro 01 (Poblacion)", 3),
            ("carig-sur", "BRGY-CARIG-SUR", "Carig Sur", 5),
        };

        foreach (var b in barangays)
        {
            var barangay = await db.Organizations
                .FirstOrDefaultAsync(o => o.TenantId == tenant.Id && o.Slug == b.Slug, ct);
            if (barangay is null)
            {
                barangay = new Organization
                {
                    TenantId = tenant.Id,
                    ParentOrganizationId = city.Id,
                    Type = OrganizationType.Barangay,
                    Code = b.Code,
                    Slug = b.Slug,
                    Name = b.Name,
                };
                db.Organizations.Add(barangay);
                await db.SaveChangesAsync(ct);
            }

            for (var i = 1; i <= b.Puroks; i++)
            {
                var code = $"P{i}";
                var exists = await db.Puroks.AnyAsync(
                    p => p.BarangayOrganizationId == barangay.Id && p.Code == code, ct);
                if (!exists)
                {
                    db.Puroks.Add(new Purok
                    {
                        TenantId = tenant.Id,
                        BarangayOrganizationId = barangay.Id,
                        Name = $"Purok {i}",
                        Code = code,
                    });
                }
            }
            await db.SaveChangesAsync(ct);
        }
    }
}
