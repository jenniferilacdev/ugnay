using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ugnay.Domain.Organizations;

namespace Ugnay.Infrastructure.Persistence.Configurations;

public class OrganizationSettingsConfiguration : IEntityTypeConfiguration<OrganizationSettings>
{
    public void Configure(EntityTypeBuilder<OrganizationSettings> builder)
    {
        builder.ToTable("organization_settings");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Province).HasMaxLength(100);
        builder.Property(s => s.Region).HasMaxLength(100);
        builder.Property(s => s.Address).HasMaxLength(400);
        builder.Property(s => s.ContactEmail).HasMaxLength(200);
        builder.Property(s => s.ContactPhone).HasMaxLength(50);
        builder.Property(s => s.LogoUrl).HasMaxLength(500);
        builder.Property(s => s.SealUrl).HasMaxLength(500);
        builder.Property(s => s.Timezone).IsRequired().HasMaxLength(64);
        builder.Property(s => s.PortalName).HasMaxLength(200);

        // One settings row per organization.
        builder.HasIndex(s => s.OrganizationId).IsUnique();

        builder.HasOne(s => s.Organization)
            .WithOne(o => o.Settings)
            .HasForeignKey<OrganizationSettings>(s => s.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property<uint>("xmin").HasColumnName("xmin").IsRowVersion();
    }
}
