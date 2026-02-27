using Microsoft.EntityFrameworkCore;
using CapSyncer.Server.Models;
using Xunit;

namespace CapSyncer.Server.Tests;

public class CoworkersApiTests : IDisposable
{
    private readonly CapSyncerDbContext _context;

    public CoworkersApiTests()
    {
        var options = new DbContextOptionsBuilder<CapSyncerDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new CapSyncerDbContext(options);
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
            Capacity = 40
        };

        // Act
        _context.Coworkers.Add(newCoworker);
        await _context.SaveChangesAsync();

        // Assert
        var coworker = await _context.Coworkers.FirstOrDefaultAsync(c => c.Name == "John Doe");
        Assert.NotNull(coworker);
        Assert.Equal("John Doe", coworker.Name);
        Assert.Equal(40, coworker.Capacity);
    }

    [Fact]
    public async Task GetCoworkerById_ReturnsCorrectCoworker()
    {
        // Arrange
        var coworker = new Coworker
        {
            Name = "Jane Smith",
            Capacity = 35
        };
        _context.Coworkers.Add(coworker);
        await _context.SaveChangesAsync();

        // Act
        var result = await _context.Coworkers.FindAsync(coworker.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Jane Smith", result.Name);
        Assert.Equal(35, result.Capacity);
    }

    [Fact]
    public async Task UpdateCoworker_ModifiesExistingCoworker()
    {
        // Arrange
        var coworker = new Coworker
        {
            Name = "Bob Wilson",
            Capacity = 40
        };
        _context.Coworkers.Add(coworker);
        await _context.SaveChangesAsync();

        // Act
        coworker.Capacity = 30;
        _context.Coworkers.Update(coworker);
        await _context.SaveChangesAsync();

        // Assert
        var updated = await _context.Coworkers.FindAsync(coworker.Id);
        Assert.NotNull(updated);
        Assert.Equal(30, updated.Capacity);
    }

    [Fact]
    public async Task DeleteCoworker_RemovesCoworkerFromDatabase()
    {
        // Arrange
        var coworker = new Coworker
        {
            Name = "Alice Brown",
            Capacity = 40
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
    public void Coworker_HasValidCapacity()
    {
        // Arrange & Act
        var coworker = new Coworker
        {
            Name = "Test User",
            Capacity = 40
        };

        // Assert
        Assert.NotNull(coworker.Name);
        Assert.True(coworker.Capacity > 0);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
