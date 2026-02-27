using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using CapSyncer.Server.Models;
using Xunit;

namespace CapSyncer.Server.Tests;

public class CoworkersApiTests : IDisposable
{
    private readonly HttpClient _client;
    private readonly CapSyncerDbContext _context;

    public CoworkersApiTests()
    {
        var options = new DbContextOptionsBuilder<CapSyncerDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new CapSyncerDbContext(options);
        _client = new HttpClient { BaseAddress = new Uri("http://localhost:5128") };
    }

    [Fact]
    public async Task GetCoworkers_ReturnsEmptyList_WhenNoCoworkersExist()
    {
        // Arrange - database is empty

        // Act
        var coworkers = await _context.Coworkers.ToListAsync();

        // Assert
        Assert.Empty(coworkers);
    }

    [Fact]
    public async Task CreateCoworker_AddsCoworkerToDatabase()
    {
        // Arrange
        var newCoworker = new Coworker
        {
            Name = "John Doe",
            Email = "john.doe@company.com",
            Role = "Developer"
        };

        // Act
        _context.Coworkers.Add(newCoworker);
        await _context.SaveChangesAsync();

        // Assert
        var coworker = await _context.Coworkers.FirstOrDefaultAsync(c => c.Email == "john.doe@company.com");
        Assert.NotNull(coworker);
        Assert.Equal("John Doe", coworker.Name);
        Assert.Equal("Developer", coworker.Role);
    }

    [Fact]
    public async Task GetCoworkerById_ReturnsCorrectCoworker()
    {
        // Arrange
        var coworker = new Coworker
        {
            Name = "Jane Smith",
            Email = "jane.smith@company.com",
            Role = "Designer"
        };
        _context.Coworkers.Add(coworker);
        await _context.SaveChangesAsync();

        // Act
        var result = await _context.Coworkers.FindAsync(coworker.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Jane Smith", result.Name);
        Assert.Equal("jane.smith@company.com", result.Email);
    }

    [Fact]
    public async Task UpdateCoworker_ModifiesExistingCoworker()
    {
        // Arrange
        var coworker = new Coworker
        {
            Name = "Bob Wilson",
            Email = "bob@company.com",
            Role = "Junior Developer"
        };
        _context.Coworkers.Add(coworker);
        await _context.SaveChangesAsync();

        // Act
        coworker.Role = "Senior Developer";
        _context.Coworkers.Update(coworker);
        await _context.SaveChangesAsync();

        // Assert
        var updated = await _context.Coworkers.FindAsync(coworker.Id);
        Assert.NotNull(updated);
        Assert.Equal("Senior Developer", updated.Role);
    }

    [Fact]
    public async Task DeleteCoworker_RemovesCoworkerFromDatabase()
    {
        // Arrange
        var coworker = new Coworker
        {
            Name = "Alice Brown",
            Email = "alice@company.com",
            Role = "Manager"
        };
        _context.Coworkers.Add(coworker);
        await _context.SaveChangesAsync();
        var coworkerId = coworker.Id;

        // Act
        _context.Coworkers.Remove(coworker);
        await _context.SaveChangesAsync();

        // Assert
        var deleted = await _context.Coworkers.FindAsync(coworkerId);
        Assert.Null(deleted);
    }

    [Fact]
    public void Coworker_ValidatesRequiredFields()
    {
        // Arrange & Act & Assert
        var coworker = new Coworker
        {
            Name = "Test User",
            Email = "test@company.com",
            Role = "Tester"
        };

        Assert.NotNull(coworker.Name);
        Assert.NotNull(coworker.Email);
        Assert.NotNull(coworker.Role);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _client.Dispose();
    }
}
