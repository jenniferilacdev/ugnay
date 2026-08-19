using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ugnay.Domain.Organizations;

namespace Ugnay.Infrastructure.Persistence.Configurations;

public class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        builder.ToTable("organizations");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Type)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(o => o.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(o => o.Code).IsRequired().HasMaxLength(50);
        builder.Property(o => o.Slug).IsRequired().HasMaxLength(100);
        builder.Property(o => o.Name).IsRequired().HasMaxLength(200);

        // Slug and code are unique within a tenant (portal routing + lookups).
        builder.HasIndex(o => new { o.TenantId, o.Slug }).IsUnique();
        builder.HasIndex(o => new { o.TenantId, o.Code }).IsUnique();
        builder.HasIndex(o => o.ParentOrganizationId);

        builder.HasOne(o => o.Tenant)
            .WithMany()
            .HasForeignKey(o => o.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        // Self-reference: never cascade — preserve government hierarchy history (spec §30).
        builder.HasOne(o => o.ParentOrganization)
            .WithMany(o => o.Children)
            .HasForeignKey(o => o.ParentOrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property<uint>("xmin").HasColumnName("xmin").IsRowVersion();
    }
}
