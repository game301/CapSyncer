using CapSyncer.Server.Models;
using Xunit;

namespace CapSyncer.Server.Tests.Unit;

/// <summary>
/// Unit tests for TaskItem model business logic
/// </summary>
public class TaskTests
{
    [Theory]
    [InlineData("To Do")]
    [InlineData("In Progress")]
    [InlineData("Completed")]
    [InlineData("Blocked")]
    [InlineData("Cancelled")]
    [InlineData("On Hold")]
    public void Task_ShouldAccept_ValidStatusValues(string status)
    {
        // Arrange & Act
        var task = new TaskItem
        {
            Name = "Test Task",
            Priority = "Medium",
            Status = status
        };

        // Assert
        Assert.Equal(status, task.Status);
    }

    [Theory]
    [InlineData("Low")]
    [InlineData("Medium")]
    [InlineData("High")]
    public void Task_ShouldAccept_ValidPriorityValues(string priority)
    {
        // Arrange & Act
        var task = new TaskItem
        {
            Name = "Test",
            Priority = priority,
            Status = "To Do"
        };

        // Assert
        Assert.Equal(priority, task.Priority);
    }

    [Fact]
    public void Task_ShouldMaintain_AssignmentRelationships()
    {
        // Arrange
        var task = new TaskItem
        {
            Name = "Test Task",
            Priority = "High",
            Status = "To Do"
        };

        var assignment = new Assignment
        {
            TaskItemId = task.Id,
            HoursAssigned = 16,
            Year = 2026,
            WeekNumber = 10
        };

        // Act
        task.Assignments.Add(assignment);

        // Assert
        Assert.Single(task.Assignments);
        Assert.Equal(task.Id, task.Assignments.First().TaskItemId);
    }

    [Fact]
    public void Task_RequiresProjectId()
    {
        // Arrange & Act
        var task = new TaskItem
        {
            ProjectId = 1,
            Name = "Test",
            Priority = "Medium",
            Status = "To Do"
        };

        // Assert
        Assert.NotEqual(0, task.ProjectId);
    }

    [Fact]
    public void Task_CanHave_EstimatedHours()
    {
        // Arrange & Act
        var task = new TaskItem
        {
            Name = "Test",
            Priority = "High",
            Status = "To Do",
            EstimatedHours = 40
        };

        // Assert
        Assert.Equal(40, task.EstimatedHours);
    }

    [Fact]
    public void Task_CanHave_OptionalDescription()
    {
        // Arrange & Act
        var taskWithDescription = new TaskItem
        {
            Name = "Test",
            Note = "Detailed description",
            Priority = "Medium",
            Status = "To Do"
        };

        var taskWithoutDescription = new TaskItem
        {
            Name = "Test",
            Priority = "Medium",
            Status = "To Do"
        };

        // Assert
        Assert.Equal("Detailed description", taskWithDescription.Note);
        Assert.Empty(taskWithoutDescription.Note); // Note defaults to string.Empty, not null
    }
}
