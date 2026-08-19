using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ugnay.Domain.Registrations;

namespace Ugnay.Infrastructure.Persistence.Configurations;

public class ResidentRegistrationConfiguration : IEntityTypeConfiguration<ResidentRegistration>
{
    public void Configure(EntityTypeBuilder<ResidentRegistration> builder)
    {
        builder.ToTable("resident_registrations");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.ReferenceNumber).IsRequired().HasMaxLength(30);
        builder.Property(r => r.FirstName).IsRequired().HasMaxLength(100);
        builder.Property(r => r.MiddleName).HasMaxLength(100);
        builder.Property(r => r.LastName).IsRequired().HasMaxLength(100);
        builder.Property(r => r.Suffix).HasMaxLength(20);
        builder.Property(r => r.ContactEmail).HasMaxLength(200);
        builder.Property(r => r.ContactPhone).HasMaxLength(50);
        builder.Property(r => r.Address).HasMaxLength(400);
        builder.Property(r => r.ReviewRemarks).HasMaxLength(1000);

        builder.Property(r => r.Sex).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(r => r.Status).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(r => new { r.TenantId, r.ReferenceNumber }).IsUnique();
        builder.HasIndex(r => new { r.OrganizationId, r.Status });

        builder.HasOne(r => r.Organization)
            .WithMany()
            .HasForeignKey(r => r.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property<uint>("xmin").HasColumnName("xmin").IsRowVersion();
    }
}
