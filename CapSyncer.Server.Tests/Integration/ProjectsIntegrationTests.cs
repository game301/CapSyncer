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
/// Integration tests for Projects API endpoints
/// </summary>
public class ProjectsIntegrationTests : IntegrationTestBase, IClassFixture<WebApplicationFactory<Program>>
{
    public ProjectsIntegrationTests(WebApplicationFactory<Program> factory) : base(factory)
    {
    }

    [Fact]
    public async Task POST_Project_CreatesProject_WithDefaultStatus()
    {
        // Arrange
        var newProject = new
        {
            Name = "Website Redesign",
            Status = "Planning"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/projects", newProject);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<Project>();
        Assert.NotNull(created);
        Assert.Equal("Website Redesign", created.Name);
        Assert.Equal("Active", created.Status);
        Assert.True(created.CreatedAt <= DateTime.UtcNow);
    }

    [Fact]
    public async Task GET_Projects_ReturnsProjectsWithTasks()
    {
        // Arrange - Create project with tasks
        var projectResponse = await _client.PostAsJsonAsync("/api/projects", new
        {
            Name = "Mobile App",
            Note = "iOS and Android app"
        });
        var project = await projectResponse.Content.ReadFromJsonAsync<Project>();

        await _client.PostAsJsonAsync("/api/tasks", new
        {
            ProjectId = project!.Id,
            Name = "Design UI",
            Note = "Create mockups",
            Priority = "High",
            Status = "Not started",
            EstimatedHours = 20,
            WeeklyEffort = 5
        });

        // Act
        var response = await _client.GetAsync("/api/projects");

        // Assert
        response.EnsureSuccessStatusCode();
        var projects = await response.Content.ReadFromJsonAsync<List<Project>>();
        Assert.NotNull(projects);
        Assert.Single(projects);
        Assert.NotNull(projects[0].Tasks);
        Assert.Single(projects[0].Tasks);
    }

    [Fact]
    public async Task PUT_Project_UpdatesStatus()
    {
        // Arrange
        var createResponse = await _client.PostAsJsonAsync("/api/projects", new
        {
            Name = "Backend Migration",
            Status = "Planning"
        });
        var project = await createResponse.Content.ReadFromJsonAsync<Project>();

        // Act
        var updateResponse = await _client.PutAsJsonAsync($"/api/projects/{project!.Id}", new
        {
            Id = project.Id,
            Name = "Backend Migration",
            Status = "Completed"
        });

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, updateResponse.StatusCode);
        
        var getResponse = await _client.GetAsync($"/api/projects/{project.Id}");
        var updated = await getResponse.Content.ReadFromJsonAsync<Project>();
        Assert.Equal("Completed", updated!.Status);
    }

    [Fact]
    public async Task DELETE_Project_CascadesDeleteToTasks()
    {
        // Arrange - Create project with task
        var projectResponse = await _client.PostAsJsonAsync("/api/projects", new
        {
            Name = "Test Project"
        });
        var project = await projectResponse.Content.ReadFromJsonAsync<Project>();

        var taskResponse = await _client.PostAsJsonAsync("/api/tasks", new
        {
            ProjectId = project!.Id,
            Name = "Test Task",
            Priority = "Medium",
            Status = "Not started",
            EstimatedHours = 15,
            WeeklyEffort = 3
        });
        var task = await taskResponse.Content.ReadFromJsonAsync<TaskItem>();

        // Act - Delete project
        var deleteResponse = await _client.DeleteAsync($"/api/projects/{project.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        
        // Verify task is also deleted (cascade)
        var taskGetResponse = await _client.GetAsync($"/api/tasks/{task!.Id}");
        Assert.Equal(HttpStatusCode.NotFound, taskGetResponse.StatusCode);
    }
}
