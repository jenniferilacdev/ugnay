using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ugnay.Domain.Organizations;

namespace Ugnay.Infrastructure.Persistence.Configurations;

public class PurokConfiguration : IEntityTypeConfiguration<Purok>
{
    public void Configure(EntityTypeBuilder<Purok> builder)
    {
        builder.ToTable("puroks");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name).IsRequired().HasMaxLength(120);
        builder.Property(p => p.Code).IsRequired().HasMaxLength(30);

        builder.Property(p => p.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // Code is unique within its barangay.
        builder.HasIndex(p => new { p.BarangayOrganizationId, p.Code }).IsUnique();
        builder.HasIndex(p => p.TenantId);

        builder.HasOne(p => p.BarangayOrganization)
            .WithMany(o => o.Puroks)
            .HasForeignKey(p => p.BarangayOrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property<uint>("xmin").HasColumnName("xmin").IsRowVersion();
    }
}
