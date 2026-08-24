using Microsoft.EntityFrameworkCore;
using Ugnay.Domain.Assistance;
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
        // The 49 barangays of Tuguegarao City, Cagayan (PSGC / PSA). Slug and code
        // are derived from the name so the list stays a plain name catalogue.
        var barangayNames = new[]
        {
            "Annafunan East", "Annafunan West", "Atulayan Norte", "Atulayan Sur",
            "Bagay", "Buntun", "Caggay", "Capatan", "Carig Norte", "Carig Sur",
            "Caritan Centro", "Caritan Norte", "Caritan Sur", "Cataggaman Nuevo",
            "Cataggaman Pardo", "Cataggaman Viejo", "Centro 01 (Poblacion)", "Centro 02",
            "Centro 03", "Centro 04", "Centro 05", "Centro 06", "Centro 07", "Centro 08",
            "Centro 09", "Centro 10", "Centro 11", "Centro 12", "Dadda", "Gosi Norte",
            "Gosi Sur", "Larion Alto", "Larion Bajo", "Leonarda", "Libag Norte",
            "Libag Sur", "Linao East", "Linao Norte", "Linao West", "Namabbalan Norte",
            "Namabbalan Sur", "Pallua Norte", "Pallua Sur", "Pengue-Ruyu", "San Gabriel",
            "Tagga", "Tanza", "Ugac Norte", "Ugac Sur",
        };

        // A handful of barangays carry seeded puroks so the purok features have data.
        var purokCounts = new Dictionary<string, int>
        {
            ["ugac-sur"] = 4,
            ["centro-01"] = 3,
            ["carig-sur"] = 5,
        };

        foreach (var name in barangayNames)
        {
            var slug = Slugify(name);
            var barangayCode = "BRGY-" + slug.ToUpperInvariant();

            var barangay = await db.Organizations
                .FirstOrDefaultAsync(o => o.TenantId == tenant.Id && o.Slug == slug, ct);
            if (barangay is null)
            {
                barangay = new Organization
                {
                    TenantId = tenant.Id,
                    ParentOrganizationId = city.Id,
                    Type = OrganizationType.Barangay,
                    Code = barangayCode,
                    Slug = slug,
                    Name = name,
                };
                db.Organizations.Add(barangay);
                await db.SaveChangesAsync(ct);
            }

            var purokCount = purokCounts.GetValueOrDefault(slug, 0);
            for (var i = 1; i <= purokCount; i++)
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

        // --- Assistance programs (spec §43) ---------------------------------
        var programs = new (string Code, string Name)[]
        {
            ("4Ps", "Pantawid Pamilyang Pilipino Program (4Ps)"),
            ("TUPAD", "Tulong Panghanapbuhay sa Ating Disadvantaged/Displaced Workers"),
            ("WNP", "Walang Gutom Program"),
        };
        foreach (var p in programs)
        {
            var exists = await db.AssistancePrograms.AnyAsync(
                a => a.TenantId == tenant.Id && a.Code == p.Code, ct);
            if (!exists)
                db.AssistancePrograms.Add(new AssistanceProgram
                {
                    TenantId = tenant.Id,
                    Code = p.Code,
                    Name = p.Name,
                });
        }
        await db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Derives a URL-safe slug from a barangay name, dropping any parenthetical
    /// (e.g. "Centro 01 (Poblacion)" → "centro-01").
    /// </summary>
    private static string Slugify(string name)
    {
        var paren = name.IndexOf('(');
        var core = (paren >= 0 ? name[..paren] : name).Trim();
        return core.ToLowerInvariant().Replace(' ', '-');
    }
}
