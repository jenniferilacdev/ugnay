using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ugnay.Domain.Requests;

namespace Ugnay.Infrastructure.Persistence.Configurations;

public class RequestConfiguration : IEntityTypeConfiguration<Request>
{
    public void Configure(EntityTypeBuilder<Request> builder)
    {
        builder.ToTable("requests");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.ReferenceNumber).IsRequired().HasMaxLength(30);
        builder.Property(r => r.Title).IsRequired().HasMaxLength(200);
        builder.Property(r => r.Description).HasMaxLength(2000);

        builder.Property(r => r.Category).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(r => r.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(r => r.Priority).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(r => new { r.TenantId, r.ReferenceNumber }).IsUnique();
        builder.HasIndex(r => new { r.OrganizationId, r.Status });
        builder.HasIndex(r => r.AssignedToUserId);

        builder.Property<uint>("xmin").HasColumnName("xmin").IsRowVersion();
    }
}

public class RequestEventConfiguration : IEntityTypeConfiguration<RequestEvent>
{
    public void Configure(EntityTypeBuilder<RequestEvent> builder)
    {
        builder.ToTable("request_events");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Type).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(e => e.FromStatus).HasConversion<string>().HasMaxLength(20);
        builder.Property(e => e.ToStatus).HasConversion<string>().HasMaxLength(20);
        builder.Property(e => e.ActorName).HasMaxLength(200);
        builder.Property(e => e.Remarks).HasMaxLength(1000);

        builder.HasIndex(e => new { e.RequestId, e.CreatedAtUtc });

        builder.HasOne(e => e.Request)
            .WithMany(r => r.Events)
            .HasForeignKey(e => e.RequestId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
