using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ugnay.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class HouseholdAddressParts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "house_number",
                table: "households",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "street",
                table: "households",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "zone",
                table: "households",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "house_number",
                table: "households");

            migrationBuilder.DropColumn(
                name: "street",
                table: "households");

            migrationBuilder.DropColumn(
                name: "zone",
                table: "households");
        }
    }
}
