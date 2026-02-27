using Microsoft.EntityFrameworkCore;
using CapSyncer.Server.Models;
using Xunit;

namespace CapSyncer.Server.Tests;

public class TasksApiTests : IDisposable
{
    private readonly CapSyncerDbContext _context;

    public TasksApiTests()
    {
        var options = new DbContextOptionsBuilder<CapSyncerDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new CapSyncerDbContext(options);
    }

    [Fact]
    public async Task CreateTask_AddsTaskToDatabase()
    {
        // Arrange
        var project = new Project
        {
            Name = "Test Project",
            Description = "Test",
            StartDate = DateTime.Now
        };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = "Implement Login",
            ProjectId = project.Id,
            Priority = "High",
            Status = "To Do",
            EstimatedHours = 8
        };

        // Act
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        // Assert
        var result = await _context.Tasks.FirstOrDefaultAsync(t => t.Name == "Implement Login");
        Assert.NotNull(result);
        Assert.Equal("High", result.Priority);
        Assert.Equal(8, result.EstimatedHours);
    }

    [Fact]
    public async Task GetTaskById_ReturnsCorrectTask()
    {
        // Arrange
        var project = new Project { Name = "P1", Description = "D1", StartDate = DateTime.Now };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = "Write Tests",
            ProjectId = project.Id,
            Priority = "Medium",
            Status = "In Progress",
            EstimatedHours = 5
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        // Act
        var result = await _context.Tasks.FindAsync(task.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Write Tests", result.Name);
        Assert.Equal("Medium", result.Priority);
    }

    [Fact]
    public async Task UpdateTask_ChangesTaskStatus()
    {
        // Arrange
        var project = new Project { Name = "P2", Description = "D2", StartDate = DateTime.Now };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = "Code Review",
            ProjectId = project.Id,
            Priority = "Low",
            Status = "To Do",
            EstimatedHours = 2
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        // Act
        task.Status = "Completed";
        _context.Tasks.Update(task);
        await _context.SaveChangesAsync();

        // Assert
        var updated = await _context.Tasks.FindAsync(task.Id);
        Assert.NotNull(updated);
        Assert.Equal("Completed", updated.Status);
    }

    [Theory]
    [InlineData("High")]
    [InlineData("Medium")]
    [InlineData("Low")]
    public async Task Task_CanHaveDifferentPriorities(string priority)
    {
        // Arrange
        var project = new Project { Name = "P3", Description = "D3", StartDate = DateTime.Now };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = $"Task with {priority} priority",
            ProjectId = project.Id,
            Priority = priority,
            Status = "To Do",
            EstimatedHours = 3
        };

        // Act
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        // Assert
        var result = await _context.Tasks.FindAsync(task.Id);
        Assert.NotNull(result);
        Assert.Equal(priority, result.Priority);
    }

    [Theory]
    [InlineData("To Do")]
    [InlineData("In Progress")]
    [InlineData("Completed")]
    public async Task Task_CanHaveDifferentStatuses(string status)
    {
        // Arrange
        var project = new Project { Name = "P4", Description = "D4", StartDate = DateTime.Now };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = $"Task with {status} status",
            ProjectId = project.Id,
            Priority = "Medium",
            Status = status,
            EstimatedHours = 4
        };

        // Act
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        // Assert
        var result = await _context.Tasks.FindAsync(task.Id);
        Assert.NotNull(result);
        Assert.Equal(status, result.Status);
    }

    [Fact]
    public async Task DeleteTask_RemovesTaskFromDatabase()
    {
        // Arrange
        var project = new Project { Name = "P5", Description = "D5", StartDate = DateTime.Now };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = "Temporary Task",
            ProjectId = project.Id,
            Priority = "Low",
            Status = "To Do",
            EstimatedHours = 1
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();
        var taskId = task.Id;

        // Act
        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();

        // Assert
        var deleted = await _context.Tasks.FindAsync(taskId);
        Assert.Null(deleted);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
