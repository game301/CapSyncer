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
/// Integration tests for Tasks API endpoints
/// </summary>
public class TasksIntegrationTests : IntegrationTestBase, IClassFixture<WebApplicationFactory<Program>>
{
    public TasksIntegrationTests(WebApplicationFactory<Program> factory) : base(factory)
    {
    }

    [Fact]
    public async Task POST_Task_RequiresProjectId()
    {
        // Arrange - Create project first
        var projectResponse = await _client.PostAsJsonAsync("/api/projects", new
        {
            Name = "Test Project"
        });
        var project = await projectResponse.Content.ReadFromJsonAsync<Project>();

        // Act
        var taskResponse = await _client.PostAsJsonAsync("/api/tasks", new
        {
            ProjectId = project!.Id,
            Name = "Implement feature",
            Note = "Add new functionality",
            Priority = "High",
            Status = "Not started",
            EstimatedHours = 16,
            WeeklyEffort = 4
        });

        // Assert
        Assert.Equal(HttpStatusCode.Created, taskResponse.StatusCode);
        var task = await taskResponse.Content.ReadFromJsonAsync<TaskItem>();
        Assert.NotNull(task);
        Assert.Equal(project.Id, task.ProjectId);
        Assert.Equal("Implement feature", task.Name);
        Assert.Equal(16, task.EstimatedHours);
    }

    [Fact]
    public async Task GET_TaskById_IncludesAssignments()
    {
        // Arrange - Create task and assignment
        var projectResponse = await _client.PostAsJsonAsync("/api/projects", new { Name = "Project" });
        var project = await projectResponse.Content.ReadFromJsonAsync<Project>();

        var coworkerResponse = await _client.PostAsJsonAsync("/api/coworkers", new
        {
            Name = "John Doe",
            Capacity = 40
        });
        var coworker = await coworkerResponse.Content.ReadFromJsonAsync<Coworker>();

        var taskResponse = await _client.PostAsJsonAsync("/api/tasks", new
        {
            ProjectId = project!.Id,
            Name = "Task 1",
            Priority = "High",
            Status = "Not started",
            EstimatedHours = 24,
            WeeklyEffort = 8
        });
        var task = await taskResponse.Content.ReadFromJsonAsync<TaskItem>();

        await _client.PostAsJsonAsync("/api/assignments", new
        {
            TaskItemId = task!.Id,
            CoworkerId = coworker!.Id,
            AssignedBy = "Manager",
            HoursAssigned = 8,
            Year = 2026,
            WeekNumber = 10
        });

        // Act
        var getResponse = await _client.GetAsync($"/api/tasks/{task.Id}");

        // Assert
        getResponse.EnsureSuccessStatusCode();
        var retrieved = await getResponse.Content.ReadFromJsonAsync<TaskItem>();
        Assert.NotNull(retrieved);
        Assert.NotNull(retrieved.Assignments);
        Assert.Single(retrieved.Assignments);
        Assert.Equal(8, retrieved.Assignments.First().HoursAssigned);
    }

    [Theory]
    [InlineData("To Do")]
    [InlineData("In Progress")]
    [InlineData("Completed")]
    [InlineData("Blocked")]
    [InlineData("Cancelled")]
    [InlineData("On Hold")]
    public async Task POST_Task_AcceptsValidStatus(string status)
    {
        // Arrange
        var projectResponse = await _client.PostAsJsonAsync("/api/projects", new { Name = "Project" });
        var project = await projectResponse.Content.ReadFromJsonAsync<Project>();

        // Act
        var response = await _client.PostAsJsonAsync("/api/tasks", new
        {
            ProjectId = project!.Id,
            Name = "Test Task",
            Priority = "Medium",
            Status = status,
            EstimatedHours = 10,
            WeeklyEffort = 2
        });

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var task = await response.Content.ReadFromJsonAsync<TaskItem>();
        Assert.Equal(status, task!.Status);
    }

    [Theory]
    [InlineData("Low")]
    [InlineData("Medium")]
    [InlineData("High")]
    public async Task POST_Task_AcceptsValidPriority(string priority)
    {
        // Arrange
        var projectResponse = await _client.PostAsJsonAsync("/api/projects", new { Name = "Project" });
        var project = await projectResponse.Content.ReadFromJsonAsync<Project>();

        // Act
        var response = await _client.PostAsJsonAsync("/api/tasks", new
        {
            ProjectId = project!.Id,
            Name = "Test Task",
            Priority = priority,
            Status = "Not started",
            EstimatedHours = 10,
            WeeklyEffort = 2
        });

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var task = await response.Content.ReadFromJsonAsync<TaskItem>();
        Assert.Equal(priority, task!.Priority);
    }

    [Fact]
    public async Task PUT_Task_UpdatesStatus()
    {
        // Arrange
        var projectResponse = await _client.PostAsJsonAsync("/api/projects", new { Name = "Project" });
        var project = await projectResponse.Content.ReadFromJsonAsync<Project>();

        var taskResponse = await _client.PostAsJsonAsync("/api/tasks", new
        {
            ProjectId = project!.Id,
            Name = "Feature",
            Priority = "High",
            Status = "Not started",
            EstimatedHours = 12,
            WeeklyEffort = 3
        });
        var task = await taskResponse.Content.ReadFromJsonAsync<TaskItem>();

        // Act
        var updateResponse = await _client.PutAsJsonAsync($"/api/tasks/{task!.Id}", new
        {
            Id = task.Id,
            ProjectId = project.Id,
            Name = "Feature",
            Priority = "High",
            Status = "Completed"
        });

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, updateResponse.StatusCode);
        
        var getResponse = await _client.GetAsync($"/api/tasks/{task.Id}");
        var updated = await getResponse.Content.ReadFromJsonAsync<TaskItem>();
        Assert.Equal("Completed", updated!.Status);
    }

}
