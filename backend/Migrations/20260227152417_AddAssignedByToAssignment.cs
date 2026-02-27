using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CapSyncer.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddAssignedByToAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AssignedBy",
                table: "Assignments",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AssignedBy",
                table: "Assignments");
        }
    }
}
