
using CapSyncer.Server.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Configure JSON serialization to handle circular references
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

// Add services to the container.
builder.Services.AddDbContext<CapSyncerDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("capsyncerdb") ?? 
                      "Host=localhost;Port=5432;Database=capsyncerdb;Username=postgres;Password=postgres"));

// CORS configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000", "http://localhost:3001", "https://localhost:3001")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
    options.AddPolicy("ProdCors", policy =>
    {
        policy.WithOrigins("https://your-production-domain.com")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
// Only use HTTPS redirection in production to avoid CORS issues in development
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors(app.Environment.IsDevelopment() ? "DevCors" : "ProdCors");

// Auto-migrate database on startup with error handling
if (app.Environment.IsDevelopment())
{
    try
    {
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<CapSyncerDbContext>();
            db.Database.Migrate();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Migration error: {ex.Message}");
    }
}


// CRUD endpoints for Coworker
app.MapGet("/api/coworkers", async (CapSyncerDbContext db) => await db.Coworkers.ToListAsync());
app.MapGet("/api/coworkers/{id}", async (int id, CapSyncerDbContext db) =>
    await db.Coworkers.FindAsync(id) is Coworker c ? Results.Ok(c) : Results.NotFound());
app.MapPost("/api/coworkers", async (Coworker c, CapSyncerDbContext db) =>
{
    db.Coworkers.Add(c);
    await db.SaveChangesAsync();
    return Results.Created($"/api/coworkers/{c.Id}", c);
});
app.MapPut("/api/coworkers/{id}", async (int id, Coworker input, CapSyncerDbContext db) =>
{
    var c = await db.Coworkers.FindAsync(id);
    if (c is null) return Results.NotFound();
    c.Name = input.Name;
    c.Capacity = input.Capacity;
    await db.SaveChangesAsync();
    return Results.Ok(c);
});
app.MapDelete("/api/coworkers/{id}", async (int id, CapSyncerDbContext db) =>
{
    var c = await db.Coworkers.FindAsync(id);
    if (c is null) return Results.NotFound();
    db.Coworkers.Remove(c);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// CRUD endpoints for Project
app.MapGet("/api/projects", async (CapSyncerDbContext db) => await db.Projects.ToListAsync());
app.MapGet("/api/projects/{id}", async (int id, CapSyncerDbContext db) =>
    await db.Projects.FindAsync(id) is Project p ? Results.Ok(p) : Results.NotFound());
app.MapPost("/api/projects", async (Project p, CapSyncerDbContext db) =>
{
    db.Projects.Add(p);
    await db.SaveChangesAsync();
    return Results.Created($"/api/projects/{p.Id}", p);
});
app.MapPut("/api/projects/{id}", async (int id, Project input, CapSyncerDbContext db) =>
{
    var p = await db.Projects.FindAsync(id);
    if (p is null) return Results.NotFound();
    p.Name = input.Name;
    await db.SaveChangesAsync();
    return Results.Ok(p);
});
app.MapDelete("/api/projects/{id}", async (int id, CapSyncerDbContext db) =>
{
    var p = await db.Projects.FindAsync(id);
    if (p is null) return Results.NotFound();
    db.Projects.Remove(p);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// CRUD endpoints for TaskItem
app.MapGet("/api/tasks", async (CapSyncerDbContext db) => await db.Tasks.ToListAsync());
app.MapGet("/api/tasks/{id}", async (int id, CapSyncerDbContext db) =>
    await db.Tasks.FirstOrDefaultAsync(t => t.Id == id) is TaskItem t ? Results.Ok(t) : Results.NotFound());
app.MapPost("/api/tasks", async (TaskItem t, CapSyncerDbContext db) =>
{
    db.Tasks.Add(t);
    await db.SaveChangesAsync();
    return Results.Created($"/api/tasks/{t.Id}", t);
});
app.MapPut("/api/tasks/{id}", async (int id, TaskItem input, CapSyncerDbContext db) =>
{
    var t = await db.Tasks.FindAsync(id);
    if (t is null) return Results.NotFound();
    t.Name = input.Name;
    t.EstimatedHours = input.EstimatedHours;
    t.ProjectId = input.ProjectId;
    await db.SaveChangesAsync();
    return Results.Ok(t);
});
app.MapDelete("/api/tasks/{id}", async (int id, CapSyncerDbContext db) =>
{
    var t = await db.Tasks.FindAsync(id);
    if (t is null) return Results.NotFound();
    db.Tasks.Remove(t);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// CRUD endpoints for Assignment
app.MapGet("/api/assignments", async (CapSyncerDbContext db) => await db.Assignments.Include(a => a.Coworker).Include(a => a.TaskItem).ToListAsync());
app.MapGet("/api/assignments/{id}", async (int id, CapSyncerDbContext db) =>
    await db.Assignments.Include(a => a.Coworker).Include(a => a.TaskItem).FirstOrDefaultAsync(a => a.Id == id) is Assignment a ? Results.Ok(a) : Results.NotFound());
app.MapPost("/api/assignments", async (Assignment a, CapSyncerDbContext db) =>
{
    db.Assignments.Add(a);
    await db.SaveChangesAsync();
    return Results.Created($"/api/assignments/{a.Id}", a);
});
app.MapPut("/api/assignments/{id}", async (int id, Assignment input, CapSyncerDbContext db) =>
{
    var a = await db.Assignments.FindAsync(id);
    if (a is null) return Results.NotFound();
    a.CoworkerId = input.CoworkerId;
    a.TaskItemId = input.TaskItemId;
    a.HoursAssigned = input.HoursAssigned;
    await db.SaveChangesAsync();
    return Results.Ok(a);
});
app.MapDelete("/api/assignments/{id}", async (int id, CapSyncerDbContext db) =>
{
    var a = await db.Assignments.FindAsync(id);
    if (a is null) return Results.NotFound();
    db.Assignments.Remove(a);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// Basic health endpoint required by the AppHost health check
app.MapGet("/health", () => Results.Ok());

// Simple API endpoint for frontend-backend communication tests
app.MapGet("/api/status", () => Results.Json(new { status = "ok", now = DateTime.UtcNow }));

app.Run();
