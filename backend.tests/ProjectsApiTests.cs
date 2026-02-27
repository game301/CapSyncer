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
            Name = "Website Redesign"
        };

        // Act
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        // Assert
        var result = await _context.Projects.FirstOrDefaultAsync(p => p.Name == "Website Redesign");
        Assert.NotNull(result);
        Assert.Equal("Website Redesign", result.Name);
    }

    [Fact]
    public async Task GetProjectById_ReturnsCorrectProject()
    {
        // Arrange
        var project = new Project
        {
            Name = "Mobile App"
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
            Name = "Backend Migration"
        };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        // Act
        project.Name = "Cloud Migration";
        _context.Projects.Update(project);
        await _context.SaveChangesAsync();

        // Assert
        var updated = await _context.Projects.FindAsync(project.Id);
        Assert.NotNull(updated);
        Assert.Equal("Cloud Migration", updated.Name);
    }

    [Fact]
    public async Task DeleteProject_RemovesProjectFromDatabase()
    {
        // Arrange
        var project = new Project
        {
            Name = "Temporary Project"
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
            new Project { Name = "Project A" },
            new Project { Name = "Project B" },
            new Project { Name = "Project C" }
        };
        _context.Projects.AddRange(projects);
        await _context.SaveChangesAsync();

        // Act
        var result = await _context.Projects.ToListAsync();

        // Assert
        Assert.Equal(3, result.Count);
    }

    [Fact]
    public void Project_HasValidName()
    {
        // Arrange & Act
        var project = new Project
        {
            Name = "Test Project"
        };

        // Assert
        Assert.NotNull(project.Name);
        Assert.NotEmpty(project.Name);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
