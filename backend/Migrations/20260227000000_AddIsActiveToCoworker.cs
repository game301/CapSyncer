using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CapSyncer.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddIsActiveToCoworker : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Coworkers",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Coworkers");
        }
    }
}
