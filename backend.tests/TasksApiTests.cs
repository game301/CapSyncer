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

    [Theory]
    [InlineData("Minor")]
    [InlineData("Normal")]
    [InlineData("Critical")]
    [InlineData("High")]
    public async Task TaskPriority_CanBeSetToValidValue(string priority)
    {
        // Arrange
        var project = new Project { Name = "Test Project" };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = "Test Task",
            Priority = priority,
            ProjectId = project.Id,
            EstimatedHours = 10,
            WeeklyEffort = 5
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
    [InlineData("Not started")]
    [InlineData("In progress")]
    [InlineData("Continuous")]
    [InlineData("Completed")]
    public async Task TaskStatus_CanBeSetToValidValue(string status)
    {
        // Arrange
        var project = new Project { Name = "Test Project" };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = "Test Task",
            Status = status,
            ProjectId = project.Id,
            EstimatedHours = 10,
            WeeklyEffort = 5
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
    public async Task CreateTask_AddsTaskToDatabase()
    {
        // Arrange
        var project = new Project { Name = "Website Project" };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = "Design Homepage",
            Priority = "High",
            Status = "Not started",
            EstimatedHours = 20,
            WeeklyEffort = 8,
            ProjectId = project.Id,
            Note = "Focus on user experience"
        };

        // Act
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        // Assert
        var result = await _context.Tasks.FirstOrDefaultAsync(t => t.Name == "Design Homepage");
        Assert.NotNull(result);
        Assert.Equal("High", result.Priority);
        Assert.Equal(20, result.EstimatedHours);
    }

    [Fact]
    public async Task UpdateTask_ModifiesExistingTask()
    {
        // Arrange
        var project = new Project { Name = "API Project" };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = "Build API",
            Priority = "Normal",
            Status = "Not started",
            ProjectId = project.Id,
            EstimatedHours = 40,
            WeeklyEffort = 10
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync ();

        // Act
        task.Status = "In progress";
        task.Priority = "High";
        _context.Tasks.Update(task);
        await _context.SaveChangesAsync();

        // Assert
        var updated = await _context.Tasks.FindAsync(task.Id);
        Assert.NotNull(updated);
        Assert.Equal("In progress", updated.Status);
        Assert.Equal("High", updated.Priority);
    }

    [Fact]
    public async Task DeleteTask_RemovesTaskFromDatabase()
    {
        // Arrange
        var project = new Project { Name = "Temp Project" };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = "Temporary Task",
            ProjectId = project.Id,
            EstimatedHours = 5,
            WeeklyEffort = 2
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

    [Fact]
    public async Task Task_HasCompletedDate_WhenStatusIsCompleted()
    {
        // Arrange
        var project = new Project { Name = "Test Project" };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = "Finished Task",
            Status = "Completed",
            ProjectId = project.Id,
            EstimatedHours = 10,
            WeeklyEffort = 5,
            Completed = DateTime.UtcNow
        };

        // Act
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        // Assert
        var result = await _context.Tasks.FindAsync(task.Id);
        Assert.NotNull(result);
        Assert.NotNull(result.Completed);
        Assert.Equal("Completed", result.Status);
    }

    [Fact]
    public async Task Task_BelongsToProject()
    {
        // Arrange
        var project = new Project { Name = "Parent Project" };
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = "Child Task",
            ProjectId = project.Id,
            EstimatedHours = 15,
            WeeklyEffort = 7
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        // Act
        var result = await _context.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == task.Id);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.Project);
        Assert.Equal("Parent Project", result.Project.Name);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
