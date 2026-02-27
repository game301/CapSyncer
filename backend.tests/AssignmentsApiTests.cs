using Microsoft.EntityFrameworkCore;
using CapSyncer.Server.Models;
using Xunit;

namespace CapSyncer.Server.Tests;

public class AssignmentsApiTests : IDisposable
{
    private readonly CapSyncerDbContext _context;

    public AssignmentsApiTests()
    {
        var options = new DbContextOptionsBuilder<CapSyncerDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new CapSyncerDbContext(options);
    }

    [Fact]
    public async Task CreateAssignment_LinksCoworkerAndTask()
    {
        // Arrange
        var coworker = new Coworker { Name = "Alice", Capacity = 40 };
        var project = new Project { Name = "Project X" };
        _context.Coworkers.Add(coworker);
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = "Implement Feature",
            ProjectId = project.Id,
            EstimatedHours = 20,
            WeeklyEffort = 10
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        var assignment = new Assignment
        {
            CoworkerId = coworker.Id,
            TaskItemId = task.Id,
            HoursAssigned = 15,
            Note = "High priority"
        };

        // Act
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        // Assert
        var result = await _context.Assignments
            .Include(a => a.Coworker)
            .Include(a => a.TaskItem)
            .FirstOrDefaultAsync(a => a.Id == assignment.Id);

        Assert.NotNull(result);
        Assert.Equal("Alice", result.Coworker?.Name);
        Assert.Equal("Implement Feature", result.TaskItem?.Name);
        Assert.Equal(15, result.HoursAssigned);
    }

    [Fact]
    public async Task GetAssignmentById_ReturnsCorrectAssignment()
    {
        // Arrange
        var coworker = new Coworker { Name = "Bob", Capacity = 35 };
        var project = new Project { Name = "Project Y" };
        _context.Coworkers.Add(coworker);
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = "Code Review",
            ProjectId = project.Id,
            EstimatedHours = 5,
            WeeklyEffort = 2
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        var assignment = new Assignment
        {
            CoworkerId = coworker.Id,
            TaskItemId = task.Id,
            HoursAssigned = 5
        };
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _context.Assignments.FindAsync(assignment.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.HoursAssigned);
    }

    [Fact]
    public async Task UpdateAssignment_ModifiesHoursAssigned()
    {
        // Arrange
        var coworker = new Coworker { Name = "Carol", Capacity = 40 };
        var project = new Project { Name = "Project Z" };
        _context.Coworkers.Add(coworker);
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = "Testing",
            ProjectId = project.Id,
            EstimatedHours = 30,
            WeeklyEffort = 15
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        var assignment = new Assignment
        {
            CoworkerId = coworker.Id,
            TaskItemId = task.Id,
            HoursAssigned = 20
        };
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        // Act
        assignment.HoursAssigned = 25;
        assignment.Note = "Extended hours needed";
        _context.Assignments.Update(assignment);
        await _context.SaveChangesAsync();

        // Assert
        var updated = await _context.Assignments.FindAsync(assignment.Id);
        Assert.NotNull(updated);
        Assert.Equal(25, updated.HoursAssigned);
        Assert.Equal("Extended hours needed", updated.Note);
    }

    [Fact]
    public async Task DeleteAssignment_RemovesAssignmentFromDatabase()
    {
        // Arrange
        var coworker = new Coworker { Name = "Dave", Capacity = 40 };
        var project = new Project { Name = "Temp Project" };
        _context.Coworkers.Add(coworker);
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = "Temp Task",
            ProjectId = project.Id,
            EstimatedHours = 10,
            WeeklyEffort = 5
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        var assignment = new Assignment
        {
            CoworkerId = coworker.Id,
            TaskItemId = task.Id,
            HoursAssigned = 10
        };
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();
        var assignmentId = assignment.Id;

        // Act
        _context.Assignments.Remove(assignment);
        await _context.SaveChangesAsync();

        // Assert
        var deleted = await _context.Assignments.FindAsync(assignmentId);
        Assert.Null(deleted);
    }

    [Fact]
    public async Task Assignment_HasAssignedDate()
    {
        // Arrange
        var coworker = new Coworker { Name = "Eve", Capacity = 40 };
        var project = new Project { Name = "Project A" };
        _context.Coworkers.Add(coworker);
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = "Documentation",
            ProjectId = project.Id,
            EstimatedHours = 8,
            WeeklyEffort = 4
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        var assignmentDate = DateTime.UtcNow;
        var assignment = new Assignment
        {
            CoworkerId = coworker.Id,
            TaskItemId = task.Id,
            HoursAssigned = 8,
            AssignedDate = assignmentDate
        };

        // Act
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        // Assert
        var result = await _context.Assignments.FindAsync(assignment.Id);
        Assert.NotNull(result);
        Assert.NotEqual(default(DateTime), result.AssignedDate);
    }

    [Fact]
    public async Task GetCoworkerAssignments_ReturnsAllAssignmentsForCoworker()
    {
        // Arrange
        var coworker = new Coworker { Name = "Frank", Capacity = 40 };
        var project = new Project { Name = "Multi-Task Project" };
        _context.Coworkers.Add(coworker);
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task1 = new TaskItem { Name = "Task 1", ProjectId = project.Id, EstimatedHours = 10, WeeklyEffort = 5 };
        var task2 = new TaskItem { Name = "Task 2", ProjectId = project.Id, EstimatedHours = 15, WeeklyEffort = 7 };
        var task3 = new TaskItem { Name = "Task 3", ProjectId = project.Id, EstimatedHours = 20, WeeklyEffort = 10 };
        _context.Tasks.AddRange(task1, task2, task3);
        await _context.SaveChangesAsync();

        var assignments = new List<Assignment>
        {
            new Assignment { CoworkerId = coworker.Id, TaskItemId = task1.Id, HoursAssigned = 10 },
            new Assignment { CoworkerId = coworker.Id, TaskItemId = task2.Id, HoursAssigned = 15 },
            new Assignment { CoworkerId = coworker.Id, TaskItemId = task3.Id, HoursAssigned = 20 }
        };
        _context.Assignments.AddRange(assignments);
        await _context.SaveChangesAsync();

        // Act
        var result = await _context.Assignments
            .Where(a => a.CoworkerId == coworker.Id)
            .ToListAsync();

        // Assert
        Assert.Equal(3, result.Count);
        Assert.Equal(45, result.Sum(a => a.HoursAssigned));
    }

    [Fact]
    public async Task Assignment_CanHaveNote()
    {
        // Arrange
        var coworker = new Coworker { Name = "Grace", Capacity = 40 };
        var project = new Project { Name = "Noted Project" };
        _context.Coworkers.Add(coworker);
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var task = new TaskItem
        {
            Name = "Special Task",
            ProjectId = project.Id,
            EstimatedHours = 12,
            WeeklyEffort = 6
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        var assignment = new Assignment
        {
            CoworkerId = coworker.Id,
            TaskItemId = task.Id,
            HoursAssigned = 12,
            Note = "Requires special attention"
        };

        // Act
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        // Assert
        var result = await _context.Assignments.FindAsync(assignment.Id);
        Assert.NotNull(result);
        Assert.Equal("Requires special attention", result.Note);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
