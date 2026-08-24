using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ugnay.Domain.Tasks;

namespace Ugnay.Infrastructure.Persistence.Configurations;

public class TaskItemConfiguration : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(EntityTypeBuilder<TaskItem> builder)
    {
        builder.ToTable("tasks");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Title).IsRequired().HasMaxLength(200);
        builder.Property(t => t.Notes).HasMaxLength(2000);
        builder.Property(t => t.RelatedRecordType).HasMaxLength(50);

        builder.Property(t => t.Priority).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(t => t.Status).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(t => new { t.OrganizationId, t.Status });
        builder.HasIndex(t => new { t.AssignedToUserId, t.Status });
        builder.HasIndex(t => new { t.RelatedRecordType, t.RelatedRecordId });

        builder.Property<uint>("xmin").HasColumnName("xmin").IsRowVersion();
    }
}
