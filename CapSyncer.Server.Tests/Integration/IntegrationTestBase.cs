using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace CapSyncer.Server.Tests.Integration;

/// <summary>
/// Base class for integration tests that provides a unique database per test class
/// </summary>
public abstract class IntegrationTestBase : IDisposable
{
    private static int _databaseCounter = 0;
    protected readonly HttpClient _client;
    protected readonly WebApplicationFactory<Program> _factory;
    private readonly string _databaseName;

    protected IntegrationTestBase(WebApplicationFactory<Program> factory)
    {
        // Generate a unique database name for this test class instance
        _databaseName = $"TestDb_{Interlocked.Increment(ref _databaseCounter)}";

        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            
            // Pass the database name via configuration
            builder.ConfigureAppConfiguration((context, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["TestDatabaseName"] = _databaseName
                });
            });
        });
        
        _client = _factory.CreateClient();
    }

    public virtual void Dispose()
    {
        _client?.Dispose();
        _factory?.Dispose();
    }
}
