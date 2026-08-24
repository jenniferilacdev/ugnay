using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ugnay.Domain.Common;
using Ugnay.Domain.Residents;

namespace Ugnay.Infrastructure.Persistence.Configurations;

public class ResidentConfiguration : IEntityTypeConfiguration<Resident>
{
    public void Configure(EntityTypeBuilder<Resident> builder)
    {
        builder.ToTable("residents");
        builder.HasKey(r => r.Id);

        builder.Ignore(r => r.FullName);

        builder.Property(r => r.ReferenceNumber).IsRequired().HasMaxLength(30);
        builder.Property(r => r.FirstName).IsRequired().HasMaxLength(100);
        builder.Property(r => r.MiddleName).HasMaxLength(100);
        builder.Property(r => r.LastName).IsRequired().HasMaxLength(100);
        builder.Property(r => r.Suffix).HasMaxLength(20);
        builder.Property(r => r.BirthPlace).HasMaxLength(200);
        builder.Property(r => r.Occupation).HasMaxLength(120);
        builder.Property(r => r.Education).HasMaxLength(120);
        builder.Property(r => r.ContactEmail).HasMaxLength(200);
        builder.Property(r => r.ContactPhone).HasMaxLength(50);
        builder.Property(r => r.EmergencyContactName).HasMaxLength(200);
        builder.Property(r => r.EmergencyContactPhone).HasMaxLength(50);
        builder.Property(r => r.PhotoUrl).HasMaxLength(500);
        builder.Property(r => r.VerificationMethod).HasMaxLength(120);
        builder.Property(r => r.VerificationRemarks).HasMaxLength(1000);
        builder.Property(r => r.ArchivedReason).HasMaxLength(300);
        builder.Property(r => r.VoterId).HasMaxLength(50);
        builder.Property(r => r.SoloParentId).HasMaxLength(50);
        builder.Property(r => r.SeniorCitizenId).HasMaxLength(50);
        builder.Property(r => r.DisabilityId).HasMaxLength(50);
        builder.Property(r => r.DisabilityType).HasMaxLength(100);
        builder.Property(r => r.EmployedType).HasMaxLength(120);
        builder.Property(r => r.UnemployedType).HasMaxLength(60);

        builder.Property(r => r.Sex).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(r => r.CivilStatus).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(r => r.EmploymentStatus).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(r => r.VerificationStatus).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(r => r.Status).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(r => new { r.TenantId, r.ReferenceNumber }).IsUnique();
        builder.HasIndex(r => r.CurrentOrganizationId);
        builder.HasIndex(r => new { r.LastName, r.FirstName });

        builder.Property<uint>("xmin").HasColumnName("xmin").IsRowVersion();
    }
}

public class ResidentResidencyConfiguration : IEntityTypeConfiguration<ResidentResidency>
{
    public void Configure(EntityTypeBuilder<ResidentResidency> builder)
    {
        builder.ToTable("resident_residencies");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Address).HasMaxLength(400);
        builder.Property(r => r.Status).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(r => new { r.ResidentId, r.Status });
        builder.HasIndex(r => r.OrganizationId);

        builder.HasOne(r => r.Resident)
            .WithMany(x => x.Residencies)
            .HasForeignKey(r => r.ResidentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Organization)
            .WithMany()
            .HasForeignKey(r => r.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Purok)
            .WithMany()
            .HasForeignKey(r => r.PurokId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property<uint>("xmin").HasColumnName("xmin").IsRowVersion();
    }
}

public class ReferenceCounterConfiguration : IEntityTypeConfiguration<ReferenceCounter>
{
    public void Configure(EntityTypeBuilder<ReferenceCounter> builder)
    {
        builder.ToTable("reference_counters");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Prefix).IsRequired().HasMaxLength(20);

        // Backs the atomic ON CONFLICT upsert used by the numbering service.
        builder.HasIndex(c => new { c.TenantId, c.Prefix, c.Year }).IsUnique();
    }
}
