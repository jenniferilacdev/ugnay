using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ugnay.Domain.Households;

namespace Ugnay.Infrastructure.Persistence.Configurations;

public class HouseholdConfiguration : IEntityTypeConfiguration<Household>
{
    public void Configure(EntityTypeBuilder<Household> builder)
    {
        builder.ToTable("households");
        builder.HasKey(h => h.Id);

        builder.Property(h => h.ReferenceNumber).IsRequired().HasMaxLength(30);
        builder.Property(h => h.Address).HasMaxLength(400);
        builder.Property(h => h.HouseNumber).HasMaxLength(50);
        builder.Property(h => h.Street).HasMaxLength(150);
        builder.Property(h => h.Zone).HasMaxLength(100);
        builder.Property(h => h.HousingType).HasMaxLength(100);
        builder.Property(h => h.ContactPhone).HasMaxLength(50);
        builder.Property(h => h.Status).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(h => new { h.TenantId, h.ReferenceNumber }).IsUnique();
        builder.HasIndex(h => h.OrganizationId);

        builder.HasOne(h => h.Organization)
            .WithMany()
            .HasForeignKey(h => h.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(h => h.Purok)
            .WithMany()
            .HasForeignKey(h => h.PurokId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property<uint>("xmin").HasColumnName("xmin").IsRowVersion();
    }
}

public class HouseholdMemberConfiguration : IEntityTypeConfiguration<HouseholdMember>
{
    public void Configure(EntityTypeBuilder<HouseholdMember> builder)
    {
        builder.ToTable("household_members");
        builder.HasKey(m => m.Id);

        builder.Property(m => m.Relationship).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(m => m.Status).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(m => new { m.HouseholdId, m.Status });
        builder.HasIndex(m => new { m.ResidentId, m.Status });

        builder.HasOne(m => m.Household)
            .WithMany(h => h.Members)
            .HasForeignKey(m => m.HouseholdId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.Resident)
            .WithMany()
            .HasForeignKey(m => m.ResidentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property<uint>("xmin").HasColumnName("xmin").IsRowVersion();
    }
}
