using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ugnay.Infrastructure.Identity;

namespace Ugnay.Infrastructure.Persistence.Configurations;

/// <summary>
/// Extends the ASP.NET Core Identity user mapping with UGNAY-specific columns.
/// The base Identity table/columns are configured by IdentityUserContext.
/// </summary>
public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.Property(u => u.FullName).HasMaxLength(200);

        builder.Property(u => u.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.HasIndex(u => u.TenantId);

        // At most one account per resident identity (spec §11).
        builder.HasIndex(u => u.ResidentId).IsUnique();
    }
}
