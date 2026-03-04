using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using CapSyncer.Server.Models;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Xunit;

namespace CapSyncer.Server.Tests.Integration;

/// <summary>
/// Integration tests for Capacity/Analytics API endpoints
/// </summary>
public class CapacityIntegrationTests : IntegrationTestBase, IClassFixture<WebApplicationFactory<Program>>
{
    public CapacityIntegrationTests(WebApplicationFactory<Program> factory) : base(factory)
    {
    }

    [Fact]
    public async Task GET_CurrentWeek_ReturnsWeekInfo()
    {
        // Act
        var response = await _client.GetAsync("/api/capacity/current-week");

        // Assert
        response.EnsureSuccessStatusCode();
        var data = await response.Content.ReadFromJsonAsync<dynamic>();
        Assert.NotNull(data);
    }

    [Fact]
    public async Task GET_WeeklyCapacity_ReturnsCoworkerUtilization()
    {
        // Arrange - Create test data
        var coworkerResponse = await _client.PostAsJsonAsync("/api/coworkers", new
        {
            Name = "John Doe",
            Capacity = 40,
            IsActive = true
        });
        var coworker = await coworkerResponse.Content.ReadFromJsonAsync<Coworker>();

        var projectResponse = await _client.PostAsJsonAsync("/api/projects", new
        {
            Name = "Test Project"
        });
        var project = await projectResponse.Content.ReadFromJsonAsync<Project>();

        var taskResponse = await _client.PostAsJsonAsync("/api/tasks", new
        {
            ProjectId = project!.Id,
            Name = "Feature",
            Priority = "High",
            Status = "Not started",
            EstimatedHours = 20,
            WeeklyEffort = 5
        });
        var task = await taskResponse.Content.ReadFromJsonAsync<TaskItem>();

        await _client.PostAsJsonAsync("/api/assignments", new
        {
            TaskItemId = task!.Id,
            CoworkerId = coworker!.Id,
            AssignedBy = "Manager",
            HoursAssigned = 16,
            Year = 2026,
            WeekNumber = 10
        });

        // Act
        var response = await _client.GetAsync("/api/capacity/weekly?year=2026&weekNumber=10");

        // Assert
        response.EnsureSuccessStatusCode();
        var data = await response.Content.ReadFromJsonAsync<List<dynamic>>();
        Assert.NotNull(data);
        Assert.Single(data);
    }

    [Fact]
    public async Task GET_WeeklyCapacity_CalculatesUtilizationPercentage()
    {
        // Arrange
        var coworkerResponse = await _client.PostAsJsonAsync("/api/coworkers", new
        {
            Name = "Jane Smith",
            Capacity = 40,
            IsActive = true
        });
        var coworker = await coworkerResponse.Content.ReadFromJsonAsync<Coworker>();

        var projectResponse = await _client.PostAsJsonAsync("/api/projects", new
        {
            Name = "Design Project"
        });
        var project = await projectResponse.Content.ReadFromJsonAsync<Project>();

        var taskResponse = await _client.PostAsJsonAsync("/api/tasks", new
        {
            ProjectId = project!.Id,
            Name = "UI Design",
            Priority = "High",
            Status = "Not started",
            EstimatedHours = 30,
            WeeklyEffort = 8
        });
        var task = await taskResponse.Content.ReadFromJsonAsync<TaskItem>();

        // Assign 20 hours to 40 hour capacity = 50% utilization
        await _client.PostAsJsonAsync("/api/assignments", new
        {
            TaskItemId = task!.Id,
            CoworkerId = coworker!.Id,
            AssignedBy = "Manager",
            HoursAssigned = 20,
            Year = 2026,
            WeekNumber = 15
        });

        // Act
        var response = await _client.GetAsync("/api/capacity/weekly?year=2026&weekNumber=15");

        // Assert
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        
        // The utilization should be 50% (20/40)
        Assert.Contains("\"utilizationPercentage\":50", json.Replace(" ", ""));
    }

    [Fact]
    public async Task GET_WeeklyCapacity_ExcludesInactiveCoworkers()
    {
        // Arrange - Create active and inactive coworkers
        var activeResponse = await _client.PostAsJsonAsync("/api/coworkers", new
        {
            Name = "Active User",
            Capacity = 40,
            IsActive = true
        });

        var inactiveResponse = await _client.PostAsJsonAsync("/api/coworkers", new
        {
            Name = "Inactive User",
            Capacity = 40,
            IsActive = true
        });
        var inactiveCoworker = await inactiveResponse.Content.ReadFromJsonAsync<Coworker>();
        
        // Deactivate the second coworker
        await _client.PutAsJsonAsync($"/api/coworkers/{inactiveCoworker!.Id}", new
        {
            Id = inactiveCoworker.Id,
            Name = "Inactive User",
            Capacity = 40,
            IsActive = false
        });

        // Act
        var response = await _client.GetAsync("/api/capacity/weekly?year=2026&weekNumber=10");

        // Assert
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        
        Assert.Contains("Active User", json);
        Assert.DoesNotContain("Inactive User", json);
    }
}
