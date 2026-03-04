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
/// Integration tests for Coworkers API endpoints
/// Tests the full request/response cycle including routing, controllers, and database
/// </summary>
public class CoworkersIntegrationTests : IntegrationTestBase, IClassFixture<WebApplicationFactory<Program>>
{
    public CoworkersIntegrationTests(WebApplicationFactory<Program> factory) : base(factory)
    {
    }

    [Fact]
    public async Task GET_Coworkers_ReturnsEmptyArray_WhenNoData()
    {
        // Act
        var response = await _client.GetAsync("/api/coworkers");
        
        // Assert
        response.EnsureSuccessStatusCode();
        var coworkers = await response.Content.ReadFromJsonAsync<List<Coworker>>();
        Assert.NotNull(coworkers);
        Assert.Empty(coworkers);
    }

    [Fact]
    public async Task POST_Coworker_CreatesNewCoworker_ReturnsCreatedCoworker()
    {
        // Arrange
        var newCoworker = new
        {
            Name = "John Doe",
            Capacity = 40,
            IsActive = true
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/coworkers", newCoworker);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<Coworker>();
        Assert.NotNull(created);
        Assert.Equal("John Doe", created.Name);
        Assert.Equal(40, created.Capacity);
        Assert.True(created.Id > 0);
    }

    [Fact]
    public async Task GET_CoworkerById_ReturnsCoworker_WhenExists()
    {
        // Arrange - Create a coworker first
        var newCoworker = new
        {
            Name = "Jane Smith",
            Capacity = 35,
            IsActive = true
        };
        var createResponse = await _client.PostAsJsonAsync("/api/coworkers", newCoworker);
        var created = await createResponse.Content.ReadFromJsonAsync<Coworker>();

        // Act
        var response = await _client.GetAsync($"/api/coworkers/{created!.Id}");

        // Assert
        response.EnsureSuccessStatusCode();
        var coworker = await response.Content.ReadFromJsonAsync<Coworker>();
        Assert.NotNull(coworker);
        Assert.Equal("Jane Smith", coworker.Name);
        Assert.Equal(created.Id, coworker.Id);
    }

    [Fact]
    public async Task GET_CoworkerById_ReturnsNotFound_WhenDoesNotExist()
    {
        // Act
        var response = await _client.GetAsync("/api/coworkers/99999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PUT_Coworker_UpdatesCoworker_ReturnsNoContent()
    {
        // Arrange - Create a coworker first
        var newCoworker = new
        {
            Name = "Bob Wilson",
            Capacity = 40,
            IsActive = true
        };
        var createResponse = await _client.PostAsJsonAsync("/api/coworkers", newCoworker);
        var created = await createResponse.Content.ReadFromJsonAsync<Coworker>();

        // Prepare update
        var updatedCoworker = new
        {
            Id = created!.Id,
            Name = "Bob Wilson Jr.",
            Capacity = 30,
            IsActive = true
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/coworkers/{created.Id}", updatedCoworker);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verify the update
        var getResponse = await _client.GetAsync($"/api/coworkers/{created.Id}");
        var updated = await getResponse.Content.ReadFromJsonAsync<Coworker>();
        Assert.NotNull(updated);
        Assert.Equal("Bob Wilson Jr.", updated.Name);
        Assert.Equal(30, updated.Capacity);
    }

    [Fact]
    public async Task PUT_Coworker_ReturnsBadRequest_WhenIdMismatch()
    {
        // Arrange
        var coworker = new
        {
            Id = 1,
            Name = "Test",
            Capacity = 40,
            IsActive = true
        };

        // Act - URL id doesn't match body id
        var response = await _client.PutAsJsonAsync("/api/coworkers/2", coworker);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task DELETE_Coworker_RemovesCoworker_ReturnsNoContent()
    {
        // Arrange - Create a coworker first
        var newCoworker = new
        {
            Name = "Alice Brown",
            Capacity = 35,
            IsActive = true
        };
        var createResponse = await _client.PostAsJsonAsync("/api/coworkers", newCoworker);
        var created = await createResponse.Content.ReadFromJsonAsync<Coworker>();

        // Act - First delete soft-deletes (sets IsActive = false)
        var response1 = await _client.DeleteAsync($"/api/coworkers/{created!.Id}");
        Assert.Equal(HttpStatusCode.OK, response1.StatusCode);

        // Act - Second delete permanently removes
        var response2 = await _client.DeleteAsync($"/api/coworkers/{created!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response2.StatusCode);

        // Verify deletion
        var getResponse = await _client.GetAsync($"/api/coworkers/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task DELETE_Coworker_ReturnsNotFound_WhenDoesNotExist()
    {
        // Act
        var response = await _client.DeleteAsync("/api/coworkers/99999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GET_Coworkers_ReturnsAllCoworkers_WhenMultipleExist()
    {
        // Arrange - Create multiple coworkers
        var coworker1 = new { Name = "User 1", Capacity = 40, IsActive = true };
        var coworker2 = new { Name = "User 2", Capacity = 35, IsActive = true };
        var coworker3 = new { Name = "User 3", Capacity = 30, IsActive = true };

        await _client.PostAsJsonAsync("/api/coworkers", coworker1);
        await _client.PostAsJsonAsync("/api/coworkers", coworker2);
        var response3 = await _client.PostAsJsonAsync("/api/coworkers", coworker3);
        var created3 = await response3.Content.ReadFromJsonAsync<Coworker>();
        
        // Deactivate User 3 via PUT
        await _client.PutAsJsonAsync($"/api/coworkers/{created3!.Id}", new 
        { 
            Id = created3.Id, 
            Name = "User 3", 
            Capacity = 30, 
            IsActive = false 
        });

        // Act
        var response = await _client.GetAsync("/api/coworkers");

        // Assert
        response.EnsureSuccessStatusCode();
        var coworkers = await response.Content.ReadFromJsonAsync<List<Coworker>>();
        Assert.NotNull(coworkers);
        Assert.Equal(3, coworkers.Count);
        Assert.Contains(coworkers, c => c.Name == "User 1");
        Assert.Contains(coworkers, c => c.Name == "User 2");
        Assert.Contains(coworkers, c => c.Name == "User 3" && !c.IsActive);
    }
}
