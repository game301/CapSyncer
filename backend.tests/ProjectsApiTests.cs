using Microsoft.EntityFrameworkCore;
using CapSyncer.Server.Models;
using Xunit;

namespace CapSyncer.Server.Tests;

public class ProjectsApiTests : IDisposable
{
    private readonly CapSyncerDbContext _context;

    public ProjectsApiTests()
    {
        var options = new DbContextOptionsBuilder<CapSyncerDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new CapSyncerDbContext(options);
    }

    [Fact]
    public async Task CreateProject_AddsProjectToDatabase()
    {
        // Arrange
        var project = new Project
        {
            Name = "Website Redesign",
            Description = "Modernize company website",
            StartDate = DateTime.Now,
            EndDate = DateTime.Now.AddMonths(3)
        };

        // Act
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        // Assert
        var result = await _context.Projects.FirstOrDefaultAsync(p => p.Name == "Website Redesign");
        Assert.NotNull(result);
        Assert.Equal("Modernize company website", result.Description);
    }

    [Fact]
    public async Task GetProjectById_ReturnsCorrectProject()
    {
        // Arrange
        var project = new Project
        {
            Name = "Mobile App",
            Description = "iOS and Android app",
            StartDate = DateTime.Now
        };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        // Act
        var result = await _context.Projects.FindAsync(project.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Mobile App", result.Name);
    }

    [Fact]
    public async Task UpdateProject_ModifiesExistingProject()
    {
        // Arrange
        var project = new Project
        {
            Name = "Backend Migration",
            Description = "Migrate to new infrastructure",
            StartDate = DateTime.Now
        };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        // Act
        project.Description = "Migrate to cloud infrastructure";
        project.EndDate = DateTime.Now.AddMonths(2);
        _context.Projects.Update(project);
        await _context.SaveChangesAsync();

        // Assert
        var updated = await _context.Projects.FindAsync(project.Id);
        Assert.NotNull(updated);
        Assert.Equal("Migrate to cloud infrastructure", updated.Description);
        Assert.NotNull(updated.EndDate);
    }

    [Fact]
    public async Task DeleteProject_RemovesProjectFromDatabase()
    {
        // Arrange
        var project = new Project
        {
            Name = "Temporary Project",
            Description = "Short-term project",
            StartDate = DateTime.Now
        };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();
        var projectId = project.Id;

        // Act
        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();

        // Assert
        var deleted = await _context.Projects.FindAsync(projectId);
        Assert.Null(deleted);
    }

    [Fact]
    public async Task GetAllProjects_ReturnsAllProjects()
    {
        // Arrange
        var projects = new List<Project>
        {
            new Project { Name = "Project A", Description = "Description A", StartDate = DateTime.Now },
            new Project { Name = "Project B", Description = "Description B", StartDate = DateTime.Now },
            new Project { Name = "Project C", Description = "Description C", StartDate = DateTime.Now }
        };
        _context.Projects.AddRange(projects);
        await _context.SaveChangesAsync();

        // Act
        var result = await _context.Projects.ToListAsync();

        // Assert
        Assert.Equal(3, result.Count);
    }

    [Fact]
    public void Project_HasValidDateRange()
    {
        // Arrange
        var startDate = DateTime.Now;
        var endDate = startDate.AddMonths(6);

        // Act
        var project = new Project
        {
            Name = "Test Project",
            Description = "Test",
            StartDate = startDate,
            EndDate = endDate
        };

        // Assert
        Assert.True(project.EndDate > project.StartDate);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
