using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ugnay.Domain.Officials;

namespace Ugnay.Infrastructure.Persistence.Configurations;

public class OfficialConfiguration : IEntityTypeConfiguration<Official>
{
    public void Configure(EntityTypeBuilder<Official> builder)
    {
        builder.ToTable("officials");
        builder.HasKey(o => o.Id);

        builder.Property(o => o.FullName).IsRequired().HasMaxLength(200);
        builder.Property(o => o.PhotoUrl).HasMaxLength(500);
        builder.Property(o => o.ContactEmail).HasMaxLength(200);
        builder.Property(o => o.ContactPhone).HasMaxLength(50);

        builder.Property(o => o.Status)
            .HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(o => o.TenantId);

        builder.Property<uint>("xmin").HasColumnName("xmin").IsRowVersion();
    }
}

public class OfficialTermConfiguration : IEntityTypeConfiguration<OfficialTerm>
{
    public void Configure(EntityTypeBuilder<OfficialTerm> builder)
    {
        builder.ToTable("official_terms");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Position).IsRequired().HasMaxLength(120);
        builder.Property(t => t.Committee).HasMaxLength(120);

        builder.Property(t => t.Status)
            .HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(t => t.OrganizationId);
        builder.HasIndex(t => new { t.OfficialId, t.Status });

        builder.HasOne(t => t.Official)
            .WithMany(o => o.Terms)
            .HasForeignKey(t => t.OfficialId)
            .OnDelete(DeleteBehavior.Cascade);

        // Never cascade from organization — preserve historical terms (spec §36).
        builder.HasOne(t => t.Organization)
            .WithMany()
            .HasForeignKey(t => t.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property<uint>("xmin").HasColumnName("xmin").IsRowVersion();
    }
}
