/*
 * CapSyncer.Server - Minimal API Backend
 * 
 * This application provides a RESTful API for team capacity management.
 * Features:
 * - Coworker management with soft delete
 * - Project and task tracking
 * - Assignment tracking with weekly capacity calculation
 * - PostgreSQL for production, InMemory for testing
 * 
 * Technology Stack:
 * - .NET 10.0 Minimal APIs
 * - Entity Framework Core with PostgreSQL
 * - xUnit for testing (114 tests)
 */

using CapSyncer.Server.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

// Configure JSON serialization to handle circular references in navigation properties
// This prevents infinite loops when serializing objects with bidirectional relationships
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

// Configure Entity Framework DbContext
// - Testing environment: Uses InMemory database (unique per test run)
// - Development/Production: Uses PostgreSQL database
builder.Services.AddDbContext<CapSyncerDbContext>(options =>
{
    var environment = builder.Environment.EnvironmentName;
    
    if (environment == "Testing")
    {
        // Use InMemory database for integration tests
        // Use the database name from configuration (set by tests) or generate a unique one
        var dbName = builder.Configuration["TestDatabaseName"] ?? $"TestDb_{Guid.NewGuid()}";
        options.UseInMemoryDatabase(dbName);
    }
    else
    {
        // Use PostgreSQL for development and production
        var connectionString = builder.Configuration.GetConnectionString("capsyncerdb") 
            ?? "Host=localhost;Port=5432;Database=capsyncerdb;Username=postgres;Password=postgres";
        
        Console.WriteLine($"Using connection string: {connectionString}");
        options.UseNpgsql(connectionString);
    }
});

// Configure CORS (Cross-Origin Resource Sharing) policies
// DevCors: Allows localhost origins for frontend development
// ProdCors: Restricts to production domain (update with actual domain)
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
        // TODO: Update with your actual production domain
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

// Auto-create database and run migrations on startup
if (app.Environment.IsDevelopment())
{
    try
    {
        using (var scope = app.Services.CreateScope())
        {
            var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var connectionString = configuration.GetConnectionString("capsyncerdb") 
                ?? "Host=localhost;Port=5432;Database=capsyncerdb;Username=postgres;Password=postgres";

            // Parse connection string to get database name
            var connStringBuilder = new Npgsql.NpgsqlConnectionStringBuilder(connectionString);
            var databaseName = connStringBuilder.Database;
            var masterConnectionString = connectionString.Replace($"Database={databaseName}", "Database=postgres");

            Console.WriteLine($"Checking if database '{databaseName}' exists...");

            // Check if database exists, create if not
            using (var masterConnection = new Npgsql.NpgsqlConnection(masterConnectionString))
            {
                await masterConnection.OpenAsync();
                
                using (var checkCmd = new Npgsql.NpgsqlCommand(
                    $"SELECT 1 FROM pg_database WHERE datname = '{databaseName}'", masterConnection))
                {
                    var exists = await checkCmd.ExecuteScalarAsync();
                    
                    if (exists == null)
                    {
                        Console.WriteLine($"Database '{databaseName}' does not exist. Creating...");
                        using (var createCmd = new Npgsql.NpgsqlCommand(
                            $"CREATE DATABASE {databaseName}", masterConnection))
                        {
                            await createCmd.ExecuteNonQueryAsync();
                            Console.WriteLine($"Database '{databaseName}' created successfully!");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"Database '{databaseName}' already exists.");
                    }
                }
            }

            // Run migrations
            var db = scope.ServiceProvider.GetRequiredService<CapSyncerDbContext>();
            Console.WriteLine($"Running migrations...");
            db.Database.Migrate();
            Console.WriteLine($"Migrations completed successfully!");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database initialization error: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        if (ex.InnerException != null)
        {
            Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
        }
    }
}

// ============================================================================
// API ENDPOINTS - COWORKERS
// ============================================================================
// Coworkers represent team members with weekly capacity (hours)
// Features: Soft delete (IsActive flag), reactivation support

/// <summary>
/// GET /api/coworkers - Returns all coworkers (including soft-deleted)
/// </summary>
app.MapGet("/api/coworkers", async (CapSyncerDbContext db) => await db.Coworkers.ToListAsync());

/// <summary>
/// GET /api/coworkers/{id} - Returns a specific coworker by ID
/// </summary>
app.MapGet("/api/coworkers/{id}", async (int id, CapSyncerDbContext db) =>
    await db.Coworkers.FindAsync(id) is Coworker c ? Results.Ok(c) : Results.NotFound());

/// <summary>
/// POST /api/coworkers - Creates a new coworker (automatically set as active)
/// </summary>
app.MapPost("/api/coworkers", async (Coworker c, CapSyncerDbContext db) =>
{
    c.IsActive = true; // New coworkers are active by default
    db.Coworkers.Add(c);
    await db.SaveChangesAsync();
    return Results.Created($"/api/coworkers/{c.Id}", c);
});

/// <summary>
/// PUT /api/coworkers/{id} - Updates an existing coworker
/// Preserves relationships with assignments
/// </summary>
app.MapPut("/api/coworkers/{id}", async (int id, Coworker input, CapSyncerDbContext db) =>
{
    // Validate ID match to prevent accidental updates
    if (input.Id != 0 && input.Id != id) return Results.BadRequest(new { error = "ID mismatch" });
    
    var c = await db.Coworkers.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
    if (c is null) return Results.NotFound();
    
    // Create a new instance with only the fields we want to update
    var coworkerToUpdate = new Coworker
    {
        Id = id,
        Name = input.Name,
        Capacity = input.Capacity,
        IsActive = input.IsActive
    };
    
    db.Coworkers.Update(coworkerToUpdate);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

/// <summary>
/// DELETE /api/coworkers/{id} - Soft delete on first call, permanent delete on second
/// First call: Sets IsActive = false (soft delete)
/// Second call: Removes from database (hard delete)
/// </summary>
app.MapDelete("/api/coworkers/{id}", async (int id, CapSyncerDbContext db) =>
{
    var c = await db.Coworkers.FindAsync(id);
    if (c is null) return Results.NotFound();
    
    if (c.IsActive)
    {
        // First delete: soft delete (set IsActive to false)
        c.IsActive = false;
        await db.SaveChangesAsync();
        return Results.Ok(new { message = "soft-delete", coworker = c });
    }
    else
    {
        // Second delete: permanent delete (remove from database)
        db.Coworkers.Remove(c);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
});

/// <summary>
/// PUT /api/coworkers/{id}/reactivate - Reactivates a soft-deleted coworker
/// Sets IsActive = true for coworkers that were soft-deleted
/// </summary>
app.MapPut("/api/coworkers/{id}/reactivate", async (int id, CapSyncerDbContext db) =>
{
    var c = await db.Coworkers.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
    if (c is null) return Results.NotFound();
    
    // Create a new instance with only the fields we want to update
    var coworkerToUpdate = new Coworker
    {
        Id = id,
        Name = c.Name,
        Capacity = c.Capacity,
        IsActive = true
    };
    
    db.Coworkers.Update(coworkerToUpdate);
    await db.SaveChangesAsync();
    return Results.Ok(coworkerToUpdate);
});

// ============================================================================
// API ENDPOINTS - PROJECTS
// ============================================================================
// Projects are containers for tasks with status tracking
// Default status: "Planning" (NOT "Active")
// Cascade delete: Deleting a project removes all its tasks and assignments

/// <summary>
/// GET /api/projects - Returns all projects with their associated tasks
/// </summary>
app.MapGet("/api/projects", async (CapSyncerDbContext db) => 
    await db.Projects.Include(p => p.Tasks).ToListAsync());

/// <summary>
/// GET /api/projects/{id} - Returns a specific project with its tasks
/// </summary>
app.MapGet("/api/projects/{id}", async (int id, CapSyncerDbContext db) =>
{
    var project = await db.Projects
        .Include(p => p.Tasks)
        .FirstOrDefaultAsync(p => p.Id == id);
    return project is not null ? Results.Ok(project) : Results.NotFound();
});
app.MapPost("/api/projects", async (Project p, CapSyncerDbContext db) =>
{
    db.Projects.Add(p);
    await db.SaveChangesAsync();
    return Results.Created($"/api/projects/{p.Id}", p);
});
app.MapPut("/api/projects/{id}", async (int id, Project input, CapSyncerDbContext db) =>
{
    var p = await db.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
    if (p is null) return Results.NotFound();
    
    // Create a new instance with only the fields we want to update
    var projectToUpdate = new Project
    {
        Id = id,
        Name = input.Name,
        Status = input.Status,
        CreatedAt = p.CreatedAt // Preserve the original creation date
    };
    
    db.Projects.Update(projectToUpdate);
    await db.SaveChangesAsync();
    return Results.NoContent();
});
app.MapDelete("/api/projects/{id}", async (int id, CapSyncerDbContext db) =>
{
    var p = await db.Projects.Include(p => p.Tasks).ThenInclude(t => t.Assignments).FirstOrDefaultAsync(p => p.Id == id);
    if (p is null) return Results.NotFound();
    
    // Manually cascade delete for InMemory database compatibility
    foreach (var task in p.Tasks.ToList())
    {
        db.Assignments.RemoveRange(task.Assignments);
        db.Tasks.Remove(task);
    }
    
    db.Projects.Remove(p);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ============================================================================
// API ENDPOINTS - TASKS
// ============================================================================
// Tasks represent work items with effort estimation and status tracking
// IMPORTANT: WeeklyEffort must be > 0 (validated on POST and PUT)
// Default status: "Planning"

/// <summary>
/// GET /api/tasks - Returns all tasks
/// </summary>
app.MapGet("/api/tasks", async (CapSyncerDbContext db) => await db.Tasks.ToListAsync());

/// <summary>
/// GET /api/tasks/{id} - Returns a specific task with its assignments
/// </summary>
app.MapGet("/api/tasks/{id}", async (int id, CapSyncerDbContext db) =>
{
    var task = await db.Tasks
        .Include(t => t.Assignments)
        .FirstOrDefaultAsync(t => t.Id == id);
    return task is not null ? Results.Ok(task) : Results.NotFound();
});
app.MapPost("/api/tasks", async (TaskItem t, CapSyncerDbContext db) =>
{
    if (t.WeeklyEffort <= 0)
    {
        return Results.BadRequest("WeeklyEffort must be greater than 0");
    }
    
    db.Tasks.Add(t);
    await db.SaveChangesAsync();
    return Results.Created($"/api/tasks/{t.Id}", t);
});
app.MapPut("/api/tasks/{id}", async (int id, TaskItem input, CapSyncerDbContext db) =>
{
    var t = await db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id);
    if (t is null) return Results.NotFound();
    
    if (input.WeeklyEffort <= 0)
    {
        return Results.BadRequest("WeeklyEffort must be greater than 0");
    }
    
    // Create a new instance with only the fields we want to update
    var taskToUpdate = new TaskItem
    {
        Id = id,
        Name = input.Name,
        Priority = input.Priority,
        Status = input.Status,
        EstimatedHours = input.EstimatedHours,
        WeeklyEffort = input.WeeklyEffort,
        Note = input.Note,
        ProjectId = input.ProjectId,
        Added = t.Added, // Preserve the original Added date
        Completed = input.Completed.HasValue ? input.Completed : t.Completed
    };
    
    db.Tasks.Update(taskToUpdate);
    await db.SaveChangesAsync();
    return Results.NoContent();
});
app.MapDelete("/api/tasks/{id}", async (int id, CapSyncerDbContext db) =>
{
    var t = await db.Tasks.FindAsync(id);
    if (t is null) return Results.NotFound();
    db.Tasks.Remove(t);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ============================================================================
// API ENDPOINTS - ASSIGNMENTS
// ============================================================================
// Assignments link coworkers to tasks with hour allocations and week tracking
// Used to calculate weekly capacity utilization

/// <summary>
/// GET /api/assignments - Returns all assignments with coworker and task details
/// </summary>
app.MapGet("/api/assignments", async (CapSyncerDbContext db) => await db.Assignments.Include(a => a.Coworker).Include(a => a.TaskItem).ToListAsync());

/// <summary>
/// GET /api/assignments/{id} - Returns a specific assignment with related data
/// </summary>
app.MapGet("/api/assignments/{id}", async (int id, CapSyncerDbContext db) =>
    await db.Assignments.Include(a => a.Coworker).Include(a => a.TaskItem).FirstOrDefaultAsync(a => a.Id == id) is Assignment a ? Results.Ok(a) : Results.NotFound());

/// <summary>
/// POST /api/assignments - Creates a new assignment
/// </summary>
app.MapPost("/api/assignments", async (Assignment a, CapSyncerDbContext db) =>
{
    db.Assignments.Add(a);
    await db.SaveChangesAsync();
    return Results.Created($"/api/assignments/{a.Id}", a);
});
app.MapPut("/api/assignments/{id}", async (int id, Assignment input, CapSyncerDbContext db) =>
{
    var a = await db.Assignments.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
    if (a is null) return Results.NotFound();
    
    // Create a new instance with only the fields we want to update
    var assignmentToUpdate = new Assignment
    {
        Id = id,
        CoworkerId = input.CoworkerId,
        TaskItemId = input.TaskItemId,
        HoursAssigned = input.HoursAssigned,
        Note = input.Note,
        AssignedDate = input.AssignedDate,
        AssignedBy = input.AssignedBy,
        Year = input.Year,
        WeekNumber = input.WeekNumber
    };
    
    db.Assignments.Update(assignmentToUpdate);
    await db.SaveChangesAsync();
    return Results.NoContent();
});
app.MapDelete("/api/assignments/{id}", async (int id, CapSyncerDbContext db) =>
{
    var a = await db.Assignments.FindAsync(id);
    if (a is null) return Results.NotFound();
    db.Assignments.Remove(a);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ============================================================================
// API ENDPOINTS - CAPACITY MANAGEMENT
// ============================================================================
// Capacity endpoints calculate weekly utilization and availability
// Based on coworker capacity, assignments, and ISO week numbers

/// <summary>
/// GET /api/capacity/weekly?year={year}&weekNumber={weekNumber}
/// Returns capacity data for all active coworkers in a specific week
/// Calculates: used hours, available hours, utilization percentage
/// </summary>
app.MapGet("/api/capacity/weekly", async (int year, int weekNumber, CapSyncerDbContext db) =>
{
    var coworkers = await db.Coworkers
        .Where(c => c.IsActive)
        .Include(c => c.Assignments)
        .ToListAsync();

    var weeklyData = coworkers.Select(coworker =>
    {
        var weekAssignments = coworker.Assignments
            .Where(a => a.Year == year && a.WeekNumber == weekNumber)
            .ToList();
        var usedHours = weekAssignments.Sum(a => a.HoursAssigned);
        var availableHours = coworker.Capacity - usedHours;
        
        return new
        {
            CoworkerId = coworker.Id,
            CoworkerName = coworker.Name,
            WeekNumber = weekNumber,
            Year = year,
            Capacity = coworker.Capacity,
            UsedHours = usedHours,
            AvailableHours = availableHours,
            UtilizationPercentage = coworker.Capacity > 0 ? (usedHours / coworker.Capacity * 100) : 0,
            AssignmentCount = weekAssignments.Count
        };
    }).ToList();

    return Results.Ok(weeklyData);
});

// Get weekly capacity for a coworker in a specific year
app.MapGet("/api/capacity/weekly/{coworkerId}/{year}", async (int coworkerId, int year, CapSyncerDbContext db) =>
{
    var coworker = await db.Coworkers.FindAsync(coworkerId);
    if (coworker is null) return Results.NotFound();

    var assignments = await db.Assignments
        .Where(a => a.CoworkerId == coworkerId && a.Year == year)
        .ToListAsync();

    var weeklyData = new List<object>();
    for (int week = 1; week <= 53; week++)
    {
        var weekAssignments = assignments.Where(a => a.WeekNumber == week).ToList();
        var usedHours = weekAssignments.Sum(a => a.HoursAssigned);
        var availableHours = coworker.Capacity - usedHours;
        
        weeklyData.Add(new
        {
            WeekNumber = week,
            Year = year,
            Capacity = coworker.Capacity,
            UsedHours = usedHours,
            AvailableHours = availableHours,
            UtilizationPercentage = coworker.Capacity > 0 ? (usedHours / coworker.Capacity * 100) : 0,
            AssignmentCount = weekAssignments.Count
        });
    }

    return Results.Ok(weeklyData);
});

// Get current week number and year
app.MapGet("/api/capacity/current-week", () =>
{
    var now = DateTime.UtcNow;
    var weekInfo = GetIsoWeekNumber(now);
    return Results.Ok(new
    {
        Year = weekInfo.Year,
        WeekNumber = weekInfo.WeekNumber,
        Date = now
    });
});

// Get ISO week number from a date
app.MapGet("/api/capacity/week-from-date", (DateTime date) =>
{
    var weekInfo = GetIsoWeekNumber(date);
    return Results.Ok(new
    {
        Year = weekInfo.Year,
        WeekNumber = weekInfo.WeekNumber,
        Date = date
    });
});

// ============================================================================
// HEALTH & STATUS ENDPOINTS
// ============================================================================

/// <summary>
/// GET /health - Basic health check endpoint
/// Used by container orchestration and monitoring systems
/// Returns: 200 OK
/// </summary>
app.MapGet("/health", () => Results.Ok());

/// <summary>
/// GET /api/status - Detailed API status endpoint
/// Returns current server time and status
/// Used for frontend-backend connectivity tests
/// </summary>
app.MapGet("/api/status", () => Results.Json(new { status = "ok", now = DateTime.UtcNow }));

app.Run();

// ============================================================================
// HELPER METHODS
// ============================================================================

/// <summary>
/// Calculates ISO 8601 week number from a given date
/// ISO week 1 is the week containing the first Thursday of the year
/// </summary>
static (int Year, int WeekNumber) GetIsoWeekNumber(DateTime date)
{
    // ISO 8601 week date system:
    // Week 1 is the first week with a Thursday in it
    var thursday = date.AddDays(3 - ((int)date.DayOfWeek + 6) % 7);
    int year = thursday.Year;
    int weekNumber = (thursday.DayOfYear - 1) / 7 + 1;
    return (year, weekNumber);
}

// Make Program class accessible for integration tests
public partial class Program { }
