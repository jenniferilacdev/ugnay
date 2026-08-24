using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ugnay.Domain.Assistance;

namespace Ugnay.Infrastructure.Persistence.Configurations;

public class AssistanceProgramConfiguration : IEntityTypeConfiguration<AssistanceProgram>
{
    public void Configure(EntityTypeBuilder<AssistanceProgram> builder)
    {
        builder.ToTable("assistance_programs");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Code).IsRequired().HasMaxLength(30);
        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);

        builder.HasIndex(p => new { p.TenantId, p.Code }).IsUnique();

        builder.Property<uint>("xmin").HasColumnName("xmin").IsRowVersion();
    }
}

public class ResidentAssistanceProgramConfiguration : IEntityTypeConfiguration<ResidentAssistanceProgram>
{
    public void Configure(EntityTypeBuilder<ResidentAssistanceProgram> builder)
    {
        builder.ToTable("resident_assistance_programs");
        builder.HasKey(x => new { x.ResidentId, x.AssistanceProgramId });

        builder.HasOne(x => x.Resident)
            .WithMany(r => r.AssistancePrograms)
            .HasForeignKey(x => x.ResidentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.AssistanceProgram)
            .WithMany()
            .HasForeignKey(x => x.AssistanceProgramId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
