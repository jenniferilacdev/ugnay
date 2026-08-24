using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ugnay.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ResidentClassificationsAndAssistancePrograms : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "disability_id",
                table: "residents",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "disability_type",
                table: "residents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "employed_type",
                table: "residents",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "employment_status",
                table: "residents",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "has_disability",
                table: "residents",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_senior_citizen",
                table: "residents",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_solo_parent",
                table: "residents",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "senior_citizen_id",
                table: "residents",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "solo_parent_id",
                table: "residents",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "unemployed_type",
                table: "residents",
                type: "character varying(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "voter_id",
                table: "residents",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "assistance_programs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_assistance_programs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "resident_assistance_programs",
                columns: table => new
                {
                    resident_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assistance_program_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_resident_assistance_programs", x => new { x.resident_id, x.assistance_program_id });
                    table.ForeignKey(
                        name: "fk_resident_assistance_programs_assistance_programs_assistance",
                        column: x => x.assistance_program_id,
                        principalTable: "assistance_programs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_resident_assistance_programs_residents_resident_id",
                        column: x => x.resident_id,
                        principalTable: "residents",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_assistance_programs_tenant_id_code",
                table: "assistance_programs",
                columns: new[] { "tenant_id", "code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_resident_assistance_programs_assistance_program_id",
                table: "resident_assistance_programs",
                column: "assistance_program_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "resident_assistance_programs");

            migrationBuilder.DropTable(
                name: "assistance_programs");

            migrationBuilder.DropColumn(
                name: "disability_id",
                table: "residents");

            migrationBuilder.DropColumn(
                name: "disability_type",
                table: "residents");

            migrationBuilder.DropColumn(
                name: "employed_type",
                table: "residents");

            migrationBuilder.DropColumn(
                name: "employment_status",
                table: "residents");

            migrationBuilder.DropColumn(
                name: "has_disability",
                table: "residents");

            migrationBuilder.DropColumn(
                name: "is_senior_citizen",
                table: "residents");

            migrationBuilder.DropColumn(
                name: "is_solo_parent",
                table: "residents");

            migrationBuilder.DropColumn(
                name: "senior_citizen_id",
                table: "residents");

            migrationBuilder.DropColumn(
                name: "solo_parent_id",
                table: "residents");

            migrationBuilder.DropColumn(
                name: "unemployed_type",
                table: "residents");

            migrationBuilder.DropColumn(
                name: "voter_id",
                table: "residents");
        }
    }
}
