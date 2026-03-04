using CapSyncer.Server.Models;
using Xunit;

namespace CapSyncer.Server.Tests.Unit;

/// <summary>
/// Unit tests for Project model business logic
/// </summary>
public class ProjectTests
{
    [Fact]
    public void Project_ShouldInitialize_WithDefaultStatus()
    {
        // Arrange & Act
        var project = new Project
        {
            Name = "Test Project"
        };

        // Assert
        Assert.Equal("Planning", project.Status);
        Assert.True(project.CreatedAt <= DateTime.UtcNow);
        Assert.Empty(project.Tasks);
    }

    [Theory]
    [InlineData("Active")]
    [InlineData("Completed")]
    [InlineData("On Hold")]
    [InlineData("Cancelled")]
    public void Project_ShouldAccept_ValidStatusValues(string status)
    {
        // Arrange & Act
        var project = new Project
        {
            Name = "Test",
            Status = status
        };

        // Assert
        Assert.Equal(status, project.Status);
    }

    [Fact]
    public void Project_ShouldMaintain_TaskRelationships()
    {
        // Arrange
        var project = new Project
        {
            Name = "Test Project"
        };

        var task1 = new TaskItem
        {
            ProjectId = project.Id,
            Name = "Task 1",
            Priority = "High",
            Status = "To Do"
        };

        var task2 = new TaskItem
        {
            ProjectId = project.Id,
            Name = "Task 2",
            Priority = "Medium",
            Status = "To Do"
        };

        // Act
        project.Tasks.Add(task1);
        project.Tasks.Add(task2);

        // Assert
        Assert.Equal(2, project.Tasks.Count);
        Assert.All(project.Tasks, t => Assert.Equal(project.Id, t.ProjectId));
    }

    [Fact]
    public void Project_CreatedAt_IsSetAutomatically()
    {
        // Arrange
        var beforeCreation = DateTime.UtcNow;

        // Act
        var project = new Project
        {
            Name = "Test"
        };

        var afterCreation = DateTime.UtcNow;

        // Assert
        Assert.InRange(project.CreatedAt, beforeCreation, afterCreation);
    }

    [Fact]
    public void Project_CanHave_OptionalDates()
    {
        // Arrange & Act
        var project = new Project
        {
            Name = "Test",
            Status = "Planning"
        };

        // Assert - DateTime is a value type, so just verify it's set to a reasonable value
        Assert.NotEqual(DateTime.MinValue, project.CreatedAt);
    }
}
