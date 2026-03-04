using CapSyncer.Server.Models;
using Xunit;

namespace CapSyncer.Server.Tests.Unit;

/// <summary>
/// Unit tests for Coworker model business logic
/// </summary>
public class CoworkerTests
{
    [Fact]
    public void Coworker_ShouldInitialize_WithDefaultValues()
    {
        // Arrange & Act
        var coworker = new Coworker
        {
            Name = "Test User",
            Capacity = 40
        };

        // Assert
        Assert.NotNull(coworker);
        Assert.Equal("Test User", coworker.Name);
        Assert.Equal(40, coworker.Capacity);
        Assert.True(coworker.IsActive); // Default should be true
        Assert.Empty(coworker.Assignments);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(10)]
    [InlineData(40)]
    [InlineData(60)]
    public void Coworker_ShouldAccept_ValidCapacityValues(int capacity)
    {
        // Arrange & Act
        var coworker = new Coworker
        {
            Name = "Test",
            Capacity = capacity
        };

        // Assert
        Assert.Equal(capacity, coworker.Capacity);
    }

    [Fact]
    public void Coworker_ShouldMaintain_AssignmentRelationships()
    {
        // Arrange
        var coworker = new Coworker
        {
            Name = "Test User",
            Capacity = 40
        };

        var assignment1 = new Assignment
        {
            CoworkerId = coworker.Id,
            HoursAssigned = 8,
            Year = 2026,
            WeekNumber = 10
        };

        var assignment2 = new Assignment
        {
            CoworkerId = coworker.Id,
            HoursAssigned = 12,
            Year = 2026,
            WeekNumber = 10
        };

        // Act
        coworker.Assignments.Add(assignment1);
        coworker.Assignments.Add(assignment2);

        // Assert
        Assert.Equal(2, coworker.Assignments.Count);
        Assert.All(coworker.Assignments, a => Assert.Equal(coworker.Id, a.CoworkerId));
    }

    [Fact]
    public void Coworker_IsActive_CanBeToggled()
    {
        // Arrange
        var coworker = new Coworker
        {
            Name = "Test",
            Capacity = 40,
            IsActive = true
        };

        // Act
        coworker.IsActive = false;

        // Assert
        Assert.False(coworker.IsActive);
    }

    [Fact]
    public void Coworker_RequiredFields_ShouldNotBeNull()
    {
        // Arrange & Act
        var coworker = new Coworker
        {
            Name = "Required Name",
            Capacity = 40
        };

        // Assert
        Assert.NotNull(coworker.Name);
        Assert.NotEqual(0, coworker.Capacity);
    }
}
