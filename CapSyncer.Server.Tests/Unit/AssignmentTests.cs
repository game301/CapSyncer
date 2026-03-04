using CapSyncer.Server.Models;
using Xunit;

namespace CapSyncer.Server.Tests.Unit;

/// <summary>
/// Unit tests for Assignment model business logic and week tracking
/// </summary>
public class AssignmentTests
{
    [Fact]
    public void Assignment_ShouldStore_WeekInformation()
    {
        // Arrange & Act
        var assignment = new Assignment
        {
            TaskItemId = 1,
            CoworkerId = 1,
            HoursAssigned = 8,
            Year = 2026,
            WeekNumber = 10,
            AssignedBy = "Manager"
        };

        // Assert
        Assert.Equal(2026, assignment.Year);
        Assert.Equal(10, assignment.WeekNumber);
        Assert.Equal(8, assignment.HoursAssigned);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(26)]
    [InlineData(52)]
    public void Assignment_ShouldAccept_ValidWeekNumbers(int weekNumber)
    {
        // Arrange & Act
        var assignment = new Assignment
        {
            TaskItemId = 1,
            CoworkerId = 1,
            HoursAssigned = 8,
            Year = 2026,
            WeekNumber = weekNumber
        };

        // Assert
        Assert.Equal(weekNumber, assignment.WeekNumber);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(8)]
    [InlineData(16)]
    [InlineData(40)]
    public void Assignment_ShouldAccept_ValidAllocatedHours(int hours)
    {
        // Arrange & Act
        var assignment = new Assignment
        {
            TaskItemId = 1,
            CoworkerId = 1,
            HoursAssigned = hours,
            Year = 2026,
            WeekNumber = 10
        };

        // Assert
        Assert.Equal(hours, assignment.HoursAssigned);
    }

    [Fact]
    public void Assignment_ShouldTrack_AssignedBy()
    {
        // Arrange & Act
        var assignment = new Assignment
        {
            TaskItemId = 1,
            CoworkerId = 1,
            HoursAssigned = 8,
            Year = 2026,
            WeekNumber = 10,
            AssignedBy = "Project Manager"
        };

        // Assert
        Assert.Equal("Project Manager", assignment.AssignedBy);
    }

    [Fact]
    public void Assignment_ShouldMaintain_TaskAndCoworkerReferences()
    {
        // Arrange
        var task = new TaskItem
        {
            Id = 5,
            Name = "Test Task",
            Priority = "High",
            Status = "To Do"
        };

        var coworker = new Coworker
        {
            Id = 3,
            Name = "John Doe",
            Capacity = 40
        };

        // Act
        var assignment = new Assignment
        {
            TaskItemId = task.Id,
            CoworkerId = coworker.Id,
            HoursAssigned = 8,
            Year = 2026,
            WeekNumber = 10
        };

        assignment.TaskItem = task;
        assignment.Coworker = coworker;

        // Assert
        Assert.Equal(5, assignment.TaskItemId);
        Assert.Equal(3, assignment.CoworkerId);
        Assert.NotNull(assignment.TaskItem);
        Assert.NotNull(assignment.Coworker);
        Assert.Equal("Test Task", assignment.TaskItem.Name);
        Assert.Equal("John Doe", assignment.Coworker.Name);
    }

    [Fact]
    public void Assignment_CanCalculate_PreviousAndNextWeek()
    {
        // Arrange
        var assignment = new Assignment
        {
            Year = 2026,
            WeekNumber = 10,
            TaskItemId = 1,
            CoworkerId = 1,
            HoursAssigned = 8
        };

        // Act - Calculate previous week
        var prevYear = assignment.WeekNumber == 1 ? assignment.Year - 1 : assignment.Year;
        var prevWeek = assignment.WeekNumber == 1 ? 52 : assignment.WeekNumber - 1;

        // Calculate next week
        var nextYear = assignment.WeekNumber == 52 ? assignment.Year + 1 : assignment.Year;
        var nextWeek = assignment.WeekNumber == 52 ? 1 : assignment.WeekNumber + 1;

        // Assert
        Assert.Equal(2026, prevYear);
        Assert.Equal(9, prevWeek);
        Assert.Equal(2026, nextYear);
        Assert.Equal(11, nextWeek);
    }

    [Fact]
    public void Assignment_HandlesYearTransition_FromWeek52ToWeek1()
    {
        // Arrange
        var assignment = new Assignment
        {
            Year = 2025,
            WeekNumber = 52,
            TaskItemId = 1,
            CoworkerId = 1,
            HoursAssigned = 8
        };

        // Act - Calculate next week (should transition to next year)
        var nextYear = assignment.WeekNumber == 52 ? assignment.Year + 1 : assignment.Year;
        var nextWeek = assignment.WeekNumber == 52 ? 1 : assignment.WeekNumber + 1;

        // Assert
        Assert.Equal(2026, nextYear);
        Assert.Equal(1, nextWeek);
    }

    [Fact]
    public void Assignment_HandlesYearTransition_FromWeek1ToWeek52()
    {
        // Arrange
        var assignment = new Assignment
        {
            Year = 2026,
            WeekNumber = 1,
            TaskItemId = 1,
            CoworkerId = 1,
            HoursAssigned = 8
        };

        // Act - Calculate previous week (should transition to previous year)
        var prevYear = assignment.WeekNumber == 1 ? assignment.Year - 1 : assignment.Year;
        var prevWeek = assignment.WeekNumber == 1 ? 52 : assignment.WeekNumber - 1;

        // Assert
        Assert.Equal(2025, prevYear);
        Assert.Equal(52, prevWeek);
    }
}
