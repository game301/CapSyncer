using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CapSyncer.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddWeekTrackingToAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "WeekNumber",
                table: "Assignments",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Year",
                table: "Assignments",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WeekNumber",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "Year",
                table: "Assignments");
        }
    }
}
