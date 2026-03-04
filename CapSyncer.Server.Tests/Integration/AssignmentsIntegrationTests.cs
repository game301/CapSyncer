using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using CapSyncer.Server.Models;
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Xunit;

namespace CapSyncer.Server.Tests.Integration;

/// <summary>
/// Integration tests for Assignments API endpoints
/// </summary>
public class AssignmentsIntegrationTests : IntegrationTestBase, IClassFixture<WebApplicationFactory<Program>>
{
    public AssignmentsIntegrationTests(WebApplicationFactory<Program> factory) : base(factory)
    {
    }

    private async Task<(Project project, TaskItem task, Coworker coworker)> CreateTestData()
    {
        var projectResponse = await _client.PostAsJsonAsync("/api/projects", new
        {
            Name = "Test Project"
        });
        var project = await projectResponse.Content.ReadFromJsonAsync<Project>();

        var taskResponse = await _client.PostAsJsonAsync("/api/tasks", new
        {
            ProjectId = project!.Id,
            Name = "Test Task",
            Priority = "High",
            Status = "Not started",
            EstimatedHours = 20,
            WeeklyEffort = 5
        });
        var task = await taskResponse.Content.ReadFromJsonAsync<TaskItem>();

        var coworkerResponse = await _client.PostAsJsonAsync("/api/coworkers", new
        {
            Name = "John Doe",
            Capacity = 40
        });
        var coworker = await coworkerResponse.Content.ReadFromJsonAsync<Coworker>();

        return (project!, task!, coworker!);
    }

    [Fact]
    public async Task POST_Assignment_CreatesAssignment_WithWeekTracking()
    {
        // Arrange
        var (_, task, coworker) = await CreateTestData();

        var assignment = new
        {
            TaskItemId = task.Id,
            CoworkerId = coworker.Id,
            AssignedBy = "Project Manager",
            HoursAssigned = 16,
            Year = 2026,
            WeekNumber = 10
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/assignments", assignment);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<Assignment>();
        Assert.NotNull(created);
        Assert.Equal(task.Id, created.TaskItemId);
        Assert.Equal(coworker.Id, created.CoworkerId);
        Assert.Equal("Project Manager", created.AssignedBy);
        Assert.Equal(16, created.HoursAssigned);
        Assert.Equal(2026, created.Year);
        Assert.Equal(10, created.WeekNumber);
    }

    [Fact]
    public async Task GET_Assignments_IncludesRelatedEntities()
    {
        // Arrange
        var (_, task, coworker) = await CreateTestData();
        
        await _client.PostAsJsonAsync("/api/assignments", new
        {
            TaskItemId = task.Id,
            CoworkerId = coworker.Id,
            AssignedBy = "Manager",
            HoursAssigned = 8,
            Year = 2026,
            WeekNumber = 10
        });

        // Act
        var response = await _client.GetAsync("/api/assignments");

        // Assert
        response.EnsureSuccessStatusCode();
        var assignments = await response.Content.ReadFromJsonAsync<List<Assignment>>();
        Assert.NotNull(assignments);
        Assert.Single(assignments);
        
        var assignment = assignments[0];
        Assert.NotNull(assignment.TaskItem);
        Assert.NotNull(assignment.Coworker);
        Assert.Equal("Test Task", assignment.TaskItem.Name);
        Assert.Equal("John Doe", assignment.Coworker.Name);
    }

    [Fact]
    public async Task PUT_Assignment_UpdatesAllocatedHours()
    {
        // Arrange
        var (_, task, coworker) = await CreateTestData();
        
        var createResponse = await _client.PostAsJsonAsync("/api/assignments", new
        {
            TaskItemId = task.Id,
            CoworkerId = coworker.Id,
            AssignedBy = "Manager",
            HoursAssigned = 8,
            Year = 2026,
            WeekNumber = 10
        });
        var assignment = await createResponse.Content.ReadFromJsonAsync<Assignment>();

        // Act
        var updateResponse = await _client.PutAsJsonAsync($"/api/assignments/{assignment!.Id}", new
        {
            Id = assignment.Id,
            TaskItemId = task.Id,
            CoworkerId = coworker.Id,
            AssignedBy = "Manager",
            HoursAssigned = 12, // Updated hours
            Year = 2026,
            WeekNumber = 10
        });

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, updateResponse.StatusCode);
        
        var getResponse = await _client.GetAsync($"/api/assignments/{assignment.Id}");
        var updated = await getResponse.Content.ReadFromJsonAsync<Assignment>();
        Assert.Equal(12, updated!.HoursAssigned);
    }

    [Fact]
    public async Task DELETE_Assignment_RemovesAssignment()
    {
        // Arrange
        var (_, task, coworker) = await CreateTestData();
        
        var createResponse = await _client.PostAsJsonAsync("/api/assignments", new
        {
            TaskItemId = task.Id,
            CoworkerId = coworker.Id,
            AssignedBy = "Manager",
            HoursAssigned = 8,
            Year = 2026,
            WeekNumber = 10
        });
        var assignment = await createResponse.Content.ReadFromJsonAsync<Assignment>();

        // Act
        var deleteResponse = await _client.DeleteAsync($"/api/assignments/{assignment!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        
        var getResponse = await _client.GetAsync($"/api/assignments/{assignment.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task GET_Assignments_CanFilterByWeek()
    {
        // Arrange
        var (_, task, coworker) = await CreateTestData();
        
        // Create assignments for different weeks
        await _client.PostAsJsonAsync("/api/assignments", new
        {
            TaskItemId = task.Id,
            CoworkerId = coworker.Id,
            AssignedBy = "Manager",
            HoursAssigned = 8,
            Year = 2026,
            WeekNumber = 10
        });

        await _client.PostAsJsonAsync("/api/assignments", new
        {
            TaskItemId = task.Id,
            CoworkerId = coworker.Id,
            AssignedBy = "Manager",
            HoursAssigned = 8,
            Year = 2026,
            WeekNumber = 11
        });

        // Act
        var response = await _client.GetAsync("/api/assignments");

        // Assert
        response.EnsureSuccessStatusCode();
        var assignments = await response.Content.ReadFromJsonAsync<List<Assignment>>();
        Assert.NotNull(assignments);
        Assert.Equal(2, assignments.Count);
        Assert.Contains(assignments, a => a.WeekNumber == 10);
        Assert.Contains(assignments, a => a.WeekNumber == 11);
    }

    [Fact]
    public async Task POST_Assignment_AllowsMultipleAssignmentsToSameTask()
    {
        // Arrange - Multiple coworkers can be assigned to same task
        var (_, task, coworker1) = await CreateTestData();
        
        var coworker2Response = await _client.PostAsJsonAsync("/api/coworkers", new
        {
            Name = "Jane Smith",
            Capacity = 40
        });
        var coworker2 = await coworker2Response.Content.ReadFromJsonAsync<Coworker>();

        // Act - Assign same task to two coworkers
        var assignment1Response = await _client.PostAsJsonAsync("/api/assignments", new
        {
            TaskItemId = task.Id,
            CoworkerId = coworker1.Id,
            AssignedBy = "Manager",
            HoursAssigned = 8,
            Year = 2026,
            WeekNumber = 10
        });

        var assignment2Response = await _client.PostAsJsonAsync("/api/assignments", new
        {
            TaskItemId = task.Id,
            CoworkerId = coworker2!.Id,
            AssignedBy = "Manager",
            HoursAssigned = 8,
            Year = 2026,
            WeekNumber = 10
        });

        // Assert
        Assert.Equal(HttpStatusCode.Created, assignment1Response.StatusCode);
        Assert.Equal(HttpStatusCode.Created, assignment2Response.StatusCode);

        var response = await _client.GetAsync("/api/assignments");
        var assignments = await response.Content.ReadFromJsonAsync<List<Assignment>>();
        Assert.Equal(2, assignments!.Count);
        Assert.All(assignments, a => Assert.Equal(task.Id, a.TaskItemId));
    }
}
