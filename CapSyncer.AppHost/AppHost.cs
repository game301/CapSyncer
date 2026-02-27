using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;
using Microsoft.AspNetCore.Builder;

var builder = DistributedApplication.CreateBuilder(args);

// 1) PostgreSQL (container for local dev)
// WithDataVolume: Creates a Docker volume so your tables/data survive container restarts.
// WithLifetime: Keeps the container running even if you stop the .NET debugger.
var postgres = builder.AddPostgres("postgres")
                      .WithDataVolume()
                      .WithLifetime(ContainerLifetime.Persistent);
var db = postgres.AddDatabase("capsyncerdb");

// 2) .NET Backend - Reference the database
var api = builder.AddProject<Projects.CapSyncer_Server>("backend")
    .WithReference(db);

// Get the API URL for the frontend - with fallback
var apiBaseUrl = "";
try
{
    apiBaseUrl = api.GetEndpoint("http").Url;
}
catch
{
    // Will be resolved at runtime if not available
    apiBaseUrl = "";
}

var web = builder.AddJavaScriptApp("frontend", "../frontend")   // requires Aspire.Hosting.JavaScript
    .WithHttpEndpoint(port: 3000, env: "PORT")                  // Next dev honors PORT
    .WithEnvironment("NEXT_PUBLIC_API_BASEURL", apiBaseUrl)
    .WithReference(api)                                         // service discovery (optional)
    .WithExternalHttpEndpoints();                               // surface endpoint externally

var distributed = builder.Build();

// The backend project maps its own endpoints (controllers/minimal APIs).
// AppHost composes and runs the distributed application; no direct casting
// to IEndpointRouteBuilder is required here.
distributed.Run();
