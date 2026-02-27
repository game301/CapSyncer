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

    private async Task<(Coworker coworker, TaskItem task)> CreateTestData()
    {
        var coworker = new Coworker
        {
            Name = "Test Developer",
            Email = "dev@test.com",
            Role = "Developer"
        };
        _context.Coworkers.Add(coworker);

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
            Name = "Test Task",
            ProjectId = project.Id,
            Priority = "Medium",
            Status = "To Do",
            EstimatedHours = 10
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        return (coworker, task);
    }

    [Fact]
    public async Task CreateAssignment_AddsAssignmentToDatabase()
    {
        // Arrange
        var (coworker, task) = await CreateTestData();

        var assignment = new Assignment
        {
            CoworkerId = coworker.Id,
            TaskItemId = task.Id,
            HoursAssigned = 8,
            AssignedDate = DateTime.Now,
            Note = "Initial assignment"
        };

        // Act
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        // Assert
        var result = await _context.Assignments.FirstOrDefaultAsync(a => a.CoworkerId == coworker.Id);
        Assert.NotNull(result);
        Assert.Equal(8, result.HoursAssigned);
        Assert.Equal("Initial assignment", result.Note);
    }

    [Fact]
    public async Task GetAssignmentById_ReturnsCorrectAssignment()
    {
        // Arrange
        var (coworker, task) = await CreateTestData();

        var assignment = new Assignment
        {
            CoworkerId = coworker.Id,
            TaskItemId = task.Id,
            HoursAssigned = 5,
            AssignedDate = DateTime.Now
        };
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _context.Assignments.FindAsync(assignment.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.HoursAssigned);
        Assert.Equal(coworker.Id, result.CoworkerId);
        Assert.Equal(task.Id, result.TaskItemId);
    }

    [Fact]
    public async Task UpdateAssignment_ModifiesHoursAssigned()
    {
        // Arrange
        var (coworker, task) = await CreateTestData();

        var assignment = new Assignment
        {
            CoworkerId = coworker.Id,
            TaskItemId = task.Id,
            HoursAssigned = 3,
            AssignedDate = DateTime.Now
        };
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        // Act
        assignment.HoursAssigned = 6;
        assignment.Note = "Hours updated";
        _context.Assignments.Update(assignment);
        await _context.SaveChangesAsync();

        // Assert
        var updated = await _context.Assignments.FindAsync(assignment.Id);
        Assert.NotNull(updated);
        Assert.Equal(6, updated.HoursAssigned);
        Assert.Equal("Hours updated", updated.Note);
    }

    [Fact]
    public async Task DeleteAssignment_RemovesAssignmentFromDatabase()
    {
        // Arrange
        var (coworker, task) = await CreateTestData();

        var assignment = new Assignment
        {
            CoworkerId = coworker.Id,
            TaskItemId = task.Id,
            HoursAssigned = 2,
            AssignedDate = DateTime.Now
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
    public async Task Assignment_CanHaveOptionalNote()
    {
        // Arrange
        var (coworker, task) = await CreateTestData();

        var assignmentWithNote = new Assignment
        {
            CoworkerId = coworker.Id,
            TaskItemId = task.Id,
            HoursAssigned = 4,
            AssignedDate = DateTime.Now,
            Note = "With note"
        };

        var assignmentWithoutNote = new Assignment
        {
            CoworkerId = coworker.Id,
            TaskItemId = task.Id,
            HoursAssigned = 4,
            AssignedDate = DateTime.Now
        };

        // Act
        _context.Assignments.AddRange(assignmentWithNote, assignmentWithoutNote);
        await _context.SaveChangesAsync();

        // Assert
        var withNote = await _context.Assignments.FindAsync(assignmentWithNote.Id);
        var withoutNote = await _context.Assignments.FindAsync(assignmentWithoutNote.Id);

        Assert.NotNull(withNote?.Note);
        Assert.Null(withoutNote?.Note);
    }

    [Fact]
    public async Task GetAssignmentsByCoworker_ReturnsCorrectAssignments()
    {
        // Arrange
        var (coworker, task) = await CreateTestData();

        var assignments = new List<Assignment>
        {
            new Assignment { CoworkerId = coworker.Id, TaskItemId = task.Id, HoursAssigned = 2, AssignedDate = DateTime.Now },
            new Assignment { CoworkerId = coworker.Id, TaskItemId = task.Id, HoursAssigned = 3, AssignedDate = DateTime.Now },
            new Assignment { CoworkerId = coworker.Id, TaskItemId = task.Id, HoursAssigned = 4, AssignedDate = DateTime.Now }
        };
        _context.Assignments.AddRange(assignments);
        await _context.SaveChangesAsync();

        // Act
        var result = await _context.Assignments
            .Where(a => a.CoworkerId == coworker.Id)
            .ToListAsync();

        // Assert
        Assert.Equal(3, result.Count);
        Assert.All(result, a => Assert.Equal(coworker.Id, a.CoworkerId));
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
