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
// ASPIRE SERVICE DEFAULTS - Observability & Monitoring
// ============================================================================

// Add Aspire service defaults: OpenTelemetry (metrics, traces, logs), health checks, service discovery
// This enables automatic monitoring in Aspire Dashboard
builder.AddServiceDefaults();

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

// Add health checks for monitoring
builder.Services.AddHealthChecks()
    .AddDbContextCheck<CapSyncerDbContext>("database", tags: new[] { "ready" });

var app = builder.Build();

// ============================================================================
// MIDDLEWARE PIPELINE
// ============================================================================

// Map health check endpoints (provided by ServiceDefaults)
app.MapDefaultEndpoints();

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
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var connectionString = configuration.GetConnectionString("capsyncerdb") 
                ?? "Host=localhost;Port=5432;Database=capsyncerdb;Username=postgres;Password=postgres";

            // Parse connection string to get database name
            var connStringBuilder = new Npgsql.NpgsqlConnectionStringBuilder(connectionString);
            var databaseName = connStringBuilder.Database;
            var masterConnectionString = connectionString.Replace($"Database={databaseName}", "Database=postgres");

            logger.LogInformation("Checking if database '{DatabaseName}' exists...", databaseName);

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
                        logger.LogInformation("Database '{DatabaseName}' does not exist. Creating...", databaseName);
                        using (var createCmd = new Npgsql.NpgsqlCommand(
                            $"CREATE DATABASE {databaseName}", masterConnection))
                        {
                            await createCmd.ExecuteNonQueryAsync();
                            logger.LogInformation("Database '{DatabaseName}' created successfully", databaseName);
                        }
                    }
                    else
                    {
                        logger.LogInformation("Database '{DatabaseName}' already exists", databaseName);
                    }
                }
            }

            // Run migrations
            var db = scope.ServiceProvider.GetRequiredService<CapSyncerDbContext>();
            logger.LogInformation("Running database migrations...");
            await db.Database.MigrateAsync();
            logger.LogInformation("Database migrations completed successfully");
        }
    }
    catch (Exception ex)
    {
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Database initialization failed: {ErrorMessage}", ex.Message);
        if (ex.InnerException != null)
        {
            logger.LogError("Inner exception: {InnerErrorMessage}", ex.InnerException.Message);
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
app.MapGet("/api/coworkers", async (CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Retrieving all coworkers");
    try
    {
        var coworkers = await db.Coworkers.ToListAsync();
        logger.LogInformation("Retrieved {Count} coworkers", coworkers.Count);
        return Results.Ok(coworkers);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to retrieve coworkers");
        return Results.Problem("Failed to retrieve coworkers");
    }
});

/// <summary>
/// GET /api/coworkers/{id} - Returns a specific coworker by ID
/// </summary>
app.MapGet("/api/coworkers/{id}", async (int id, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Retrieving coworker with ID: {CoworkerId}", id);
    try
    {
        var coworker = await db.Coworkers.FindAsync(id);
        if (coworker is null)
        {
            logger.LogWarning("Coworker not found: ID {CoworkerId}", id);
            return Results.NotFound();
        }
        logger.LogInformation("Retrieved coworker: {CoworkerName} (ID: {CoworkerId})", coworker.Name, id);
        return Results.Ok(coworker);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to retrieve coworker with ID: {CoworkerId}", id);
        return Results.Problem("Failed to retrieve coworker");
    }
});

/// <summary>
/// POST /api/coworkers - Creates a new coworker (automatically set as active)
/// </summary>
app.MapPost("/api/coworkers", async (Coworker c, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Creating new coworker: {CoworkerName} with capacity {Capacity}h", c.Name, c.Capacity);
    try
    {
        c.IsActive = true; // New coworkers are active by default
        db.Coworkers.Add(c);
        await db.SaveChangesAsync();
        logger.LogInformation("Coworker created successfully: {CoworkerName} (ID: {CoworkerId})", c.Name, c.Id);
        return Results.Created($"/api/coworkers/{c.Id}", c);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to create coworker: {CoworkerName}", c.Name);
        return Results.Problem("Failed to create coworker");
    }
});

/// <summary>
/// PUT /api/coworkers/{id} - Updates an existing coworker
/// Preserves relationships with assignments
/// </summary>
app.MapPut("/api/coworkers/{id}", async (int id, Coworker input, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Updating coworker ID: {CoworkerId} to name: {CoworkerName}, capacity: {Capacity}h, active: {IsActive}", 
        id, input.Name, input.Capacity, input.IsActive);
    try
    {
        // Validate ID match to prevent accidental updates
        if (input.Id != 0 && input.Id != id)
        {
            logger.LogWarning("ID mismatch when updating coworker: URL ID {UrlId} != Body ID {BodyId}", id, input.Id);
            return Results.BadRequest(new { error = "ID mismatch" });
        }
        
        var c = await db.Coworkers.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
        if (c is null)
        {
            logger.LogWarning("Coworker not found for update: ID {CoworkerId}", id);
            return Results.NotFound();
        }
        
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
        logger.LogInformation("Coworker updated successfully: {CoworkerName} (ID: {CoworkerId})", input.Name, id);
        return Results.NoContent();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to update coworker ID: {CoworkerId}", id);
        return Results.Problem("Failed to update coworker");
    }
});

/// <summary>
/// DELETE /api/coworkers/{id} - Soft delete on first call, permanent delete on second
/// First call: Sets IsActive = false (soft delete)
/// Second call: Removes from database (hard delete)
/// </summary>
app.MapDelete("/api/coworkers/{id}", async (int id, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Delete requested for coworker ID: {CoworkerId}", id);
    try
    {
        var c = await db.Coworkers.FindAsync(id);
        if (c is null)
        {
            logger.LogWarning("Coworker not found for deletion: ID {CoworkerId}", id);
            return Results.NotFound();
        }
        
        if (c.IsActive)
        {
            // First delete: soft delete (set IsActive to false)
            c.IsActive = false;
            await db.SaveChangesAsync();
            logger.LogInformation("Coworker soft-deleted: {CoworkerName} (ID: {CoworkerId})", c.Name, id);
            return Results.Ok(new { message = "soft-delete", coworker = c });
        }
        else
        {
            // Second delete: permanent delete (remove from database)
            db.Coworkers.Remove(c);
            await db.SaveChangesAsync();
            logger.LogWarning("Coworker permanently deleted: {CoworkerName} (ID: {CoworkerId})", c.Name, id);
            return Results.NoContent();
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to delete coworker ID: {CoworkerId}", id);
        return Results.Problem("Failed to delete coworker");
    }
});

/// <summary>
/// PUT /api/coworkers/{id}/reactivate - Reactivates a soft-deleted coworker
/// Sets IsActive = true for coworkers that were soft-deleted
/// </summary>
app.MapPut("/api/coworkers/{id}/reactivate", async (int id, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Reactivation requested for coworker ID: {CoworkerId}", id);
    try
    {
        var c = await db.Coworkers.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
        if (c is null)
        {
            logger.LogWarning("Coworker not found for reactivation: ID {CoworkerId}", id);
            return Results.NotFound();
        }
        
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
        logger.LogInformation("Coworker reactivated: {CoworkerName} (ID: {CoworkerId})", c.Name, id);
        return Results.Ok(coworkerToUpdate);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to reactivate coworker ID: {CoworkerId}", id);
        return Results.Problem("Failed to reactivate coworker");
    }
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
app.MapGet("/api/projects", async (CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Retrieving all projects with tasks");
    try
    {
        var projects = await db.Projects.Include(p => p.Tasks).ToListAsync();
        logger.LogInformation("Retrieved {Count} projects", projects.Count);
        return Results.Ok(projects);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to retrieve projects");
        return Results.Problem("Failed to retrieve projects");
    }
});

/// <summary>
/// GET /api/projects/{id} - Returns a specific project with its tasks
/// </summary>
app.MapGet("/api/projects/{id}", async (int id, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Retrieving project with ID: {ProjectId}", id);
    try
    {
        var project = await db.Projects
            .Include(p => p.Tasks)
            .FirstOrDefaultAsync(p => p.Id == id);
        
        if (project is null)
        {
            logger.LogWarning("Project not found: ID {ProjectId}", id);
            return Results.NotFound();
        }
        
        logger.LogInformation("Retrieved project: {ProjectName} (ID: {ProjectId}) with {TaskCount} tasks", 
            project.Name, id, project.Tasks.Count);
        return Results.Ok(project);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to retrieve project with ID: {ProjectId}", id);
        return Results.Problem("Failed to retrieve project");
    }
});
app.MapPost("/api/projects", async (Project p, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Creating new project: {ProjectName} with status: {Status}", p.Name, p.Status);
    try
    {
        db.Projects.Add(p);
        await db.SaveChangesAsync();
        logger.LogInformation("Project created successfully: {ProjectName} (ID: {ProjectId})", p.Name, p.Id);
        return Results.Created($"/api/projects/{p.Id}", p);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to create project: {ProjectName}", p.Name);
        return Results.Problem("Failed to create project");
    }
});
app.MapPut("/api/projects/{id}", async (int id, Project input, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Updating project ID: {ProjectId} to name: {ProjectName}, status: {Status}", 
        id, input.Name, input.Status);
    try
    {
        var p = await db.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        if (p is null)
        {
            logger.LogWarning("Project not found for update: ID {ProjectId}", id);
            return Results.NotFound();
        }
        
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
        logger.LogInformation("Project updated successfully: {ProjectName} (ID: {ProjectId})", input.Name, id);
        return Results.NoContent();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to update project ID: {ProjectId}", id);
        return Results.Problem("Failed to update project");
    }
});
app.MapDelete("/api/projects/{id}", async (int id, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Delete requested for project ID: {ProjectId}", id);
    try
    {
        var p = await db.Projects.Include(p => p.Tasks).ThenInclude(t => t.Assignments).FirstOrDefaultAsync(p => p.Id == id);
        if (p is null)
        {
            logger.LogWarning("Project not found for deletion: ID {ProjectId}", id);
            return Results.NotFound();
        }
        
        var taskCount = p.Tasks.Count;
        var assignmentCount = p.Tasks.Sum(t => t.Assignments.Count);
        
        // Manually cascade delete for InMemory database compatibility
        foreach (var task in p.Tasks.ToList())
        {
            db.Assignments.RemoveRange(task.Assignments);
            db.Tasks.Remove(task);
        }
        
        db.Projects.Remove(p);
        await db.SaveChangesAsync();
        logger.LogWarning("Project deleted: {ProjectName} (ID: {ProjectId}) with {TaskCount} tasks and {AssignmentCount} assignments", 
            p.Name, id, taskCount, assignmentCount);
        return Results.NoContent();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to delete project ID: {ProjectId}", id);
        return Results.Problem("Failed to delete project");
    }
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
app.MapGet("/api/tasks", async (CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Retrieving all tasks");
    try
    {
        var tasks = await db.Tasks.ToListAsync();
        logger.LogInformation("Retrieved {Count} tasks", tasks.Count);
        return Results.Ok(tasks);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to retrieve tasks");
        return Results.Problem("Failed to retrieve tasks");
    }
});

/// <summary>
/// GET /api/tasks/{id} - Returns a specific task with its assignments
/// </summary>
app.MapGet("/api/tasks/{id}", async (int id, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Retrieving task with ID: {TaskId}", id);
    try
    {
        var task = await db.Tasks
            .Include(t => t.Assignments)
            .FirstOrDefaultAsync(t => t.Id == id);
        
        if (task is null)
        {
            logger.LogWarning("Task not found: ID {TaskId}", id);
            return Results.NotFound();
        }
        
        logger.LogInformation("Retrieved task: {TaskName} (ID: {TaskId}) with {AssignmentCount} assignments", 
            task.Name, id, task.Assignments.Count);
        return Results.Ok(task);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to retrieve task with ID: {TaskId}", id);
        return Results.Problem("Failed to retrieve task");
    }
});
app.MapPost("/api/tasks", async (TaskItem t, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Creating new task: {TaskName} with weekly effort: {WeeklyEffort}h, status: {Status}", 
        t.Name, t.WeeklyEffort, t.Status);
    try
    {
        if (t.WeeklyEffort <= 0)
        {
            logger.LogWarning("Task creation failed: Invalid WeeklyEffort {WeeklyEffort} for task {TaskName}", 
                t.WeeklyEffort, t.Name);
            return Results.BadRequest("WeeklyEffort must be greater than 0");
        }
        
        db.Tasks.Add(t);
        await db.SaveChangesAsync();
        logger.LogInformation("Task created successfully: {TaskName} (ID: {TaskId})", t.Name, t.Id);
        return Results.Created($"/api/tasks/{t.Id}", t);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to create task: {TaskName}", t.Name);
        return Results.Problem("Failed to create task");
    }
});
app.MapPut("/api/tasks/{id}", async (int id, TaskItem input, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Updating task ID: {TaskId} to name: {TaskName}, weekly effort: {WeeklyEffort}h, status: {Status}", 
        id, input.Name, input.WeeklyEffort, input.Status);
    try
    {
        var t = await db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id);
        if (t is null)
        {
            logger.LogWarning("Task not found for update: ID {TaskId}", id);
            return Results.NotFound();
        }
        
        if (input.WeeklyEffort <= 0)
        {
            logger.LogWarning("Task update failed: Invalid WeeklyEffort {WeeklyEffort} for task ID {TaskId}", 
                input.WeeklyEffort, id);
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
        logger.LogInformation("Task updated successfully: {TaskName} (ID: {TaskId})", input.Name, id);
        return Results.NoContent();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to update task ID: {TaskId}", id);
        return Results.Problem("Failed to update task");
    }
});
app.MapDelete("/api/tasks/{id}", async (int id, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Delete requested for task ID: {TaskId}", id);
    try
    {
        var t = await db.Tasks.FindAsync(id);
        if (t is null)
        {
            logger.LogWarning("Task not found for deletion: ID {TaskId}", id);
            return Results.NotFound();
        }
        
        db.Tasks.Remove(t);
        await db.SaveChangesAsync();
        logger.LogWarning("Task deleted: {TaskName} (ID: {TaskId})", t.Name, id);
        return Results.NoContent();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to delete task ID: {TaskId}", id);
        return Results.Problem("Failed to delete task");
    }
});

// ============================================================================
// API ENDPOINTS - ASSIGNMENTS
// ============================================================================
// Assignments link coworkers to tasks with hour allocations and week tracking
// Used to calculate weekly capacity utilization

/// <summary>
/// GET /api/assignments - Returns all assignments with coworker and task details
/// </summary>
app.MapGet("/api/assignments", async (CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Retrieving all assignments");
    try
    {
        var assignments = await db.Assignments.Include(a => a.Coworker).Include(a => a.TaskItem).ToListAsync();
        logger.LogInformation("Retrieved {Count} assignments", assignments.Count);
        return Results.Ok(assignments);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to retrieve assignments");
        return Results.Problem("Failed to retrieve assignments");
    }
});

/// <summary>
/// GET /api/assignments/{id} - Returns a specific assignment with related data
/// </summary>
app.MapGet("/api/assignments/{id}", async (int id, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Retrieving assignment with ID: {AssignmentId}", id);
    try
    {
        var assignment = await db.Assignments.Include(a => a.Coworker).Include(a => a.TaskItem).FirstOrDefaultAsync(a => a.Id == id);
        if (assignment is null)
        {
            logger.LogWarning("Assignment not found: ID {AssignmentId}", id);
            return Results.NotFound();
        }
        
        logger.LogInformation("Retrieved assignment ID: {AssignmentId} - Coworker: {CoworkerName}, Task: {TaskName}, Hours: {Hours}", 
            id, assignment.Coworker?.Name, assignment.TaskItem?.Name, assignment.HoursAssigned);
        return Results.Ok(assignment);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to retrieve assignment with ID: {AssignmentId}", id);
        return Results.Problem("Failed to retrieve assignment");
    }
});

/// <summary>
/// POST /api/assignments - Creates a new assignment
/// </summary>
app.MapPost("/api/assignments", async (Assignment a, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Creating new assignment: Coworker ID {CoworkerId}, Task ID {TaskId}, Hours: {Hours}, Week: {Year}-W{Week}", 
        a.CoworkerId, a.TaskItemId, a.HoursAssigned, a.Year, a.WeekNumber);
    try
    {
        db.Assignments.Add(a);
        await db.SaveChangesAsync();
        logger.LogInformation("Assignment created successfully: ID {AssignmentId}", a.Id);
        return Results.Created($"/api/assignments/{a.Id}", a);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to create assignment for Coworker ID {CoworkerId}, Task ID {TaskId}", 
            a.CoworkerId, a.TaskItemId);
        return Results.Problem("Failed to create assignment");
    }
});
app.MapPut("/api/assignments/{id}", async (int id, Assignment input, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Updating assignment ID: {AssignmentId} - Coworker: {CoworkerId}, Task: {TaskId}, Hours: {Hours}", 
        id, input.CoworkerId, input.TaskItemId, input.HoursAssigned);
    try
    {
        var a = await db.Assignments.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
        if (a is null)
        {
            logger.LogWarning("Assignment not found for update: ID {AssignmentId}", id);
            return Results.NotFound();
        }
        
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
        logger.LogInformation("Assignment updated successfully: ID {AssignmentId}", id);
        return Results.NoContent();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to update assignment ID: {AssignmentId}", id);
        return Results.Problem("Failed to update assignment");
    }
});
app.MapDelete("/api/assignments/{id}", async (int id, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Delete requested for assignment ID: {AssignmentId}", id);
    try
    {
        var a = await db.Assignments.FindAsync(id);
        if (a is null)
        {
            logger.LogWarning("Assignment not found for deletion: ID {AssignmentId}", id);
            return Results.NotFound();
        }
        
        db.Assignments.Remove(a);
        await db.SaveChangesAsync();
        logger.LogWarning("Assignment deleted: ID {AssignmentId} (Coworker: {CoworkerId}, Task: {TaskId})", 
            id, a.CoworkerId, a.TaskItemId);
        return Results.NoContent();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to delete assignment ID: {AssignmentId}", id);
        return Results.Problem("Failed to delete assignment");
    }
});

// ============================================================================
// API ENDPOINTS - CALENDAR
// ============================================================================
// Calendar endpoints provide weekly capacity data and ISO week utilities
// Based on coworker capacity, assignments, and ISO week numbers

/// <summary>
/// GET /api/calendar/weekly?year={year}&weekNumber={weekNumber}
/// Returns capacity data for all active coworkers in a specific week
/// Calculates: used hours, available hours, utilization percentage
/// </summary>
app.MapGet("/api/calendar/weekly", async (int year, int weekNumber, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Retrieving weekly capacity for year: {Year}, week: {WeekNumber}", year, weekNumber);
    try
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

        logger.LogInformation("Retrieved weekly capacity for {CoworkerCount} coworkers in {Year}-W{WeekNumber}", 
            coworkers.Count, year, weekNumber);
        return Results.Ok(weeklyData);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to retrieve weekly capacity for {Year}-W{WeekNumber}", year, weekNumber);
        return Results.Problem("Failed to retrieve weekly capacity");
    }
});

// Get weekly capacity for a coworker in a specific year
app.MapGet("/api/calendar/weekly/{coworkerId}/{year}", async (int coworkerId, int year, CapSyncerDbContext db, ILogger<Program> logger) =>
{
    logger.LogInformation("Retrieving yearly capacity for coworker ID: {CoworkerId}, year: {Year}", coworkerId, year);
    try
    {
        var coworker = await db.Coworkers.FindAsync(coworkerId);
        if (coworker is null)
        {
            logger.LogWarning("Coworker not found for capacity query: ID {CoworkerId}", coworkerId);
            return Results.NotFound();
        }

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

        logger.LogInformation("Retrieved 53-week capacity data for coworker: {CoworkerName} (ID: {CoworkerId}), year: {Year}", 
            coworker.Name, coworkerId, year);
        return Results.Ok(weeklyData);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to retrieve yearly capacity for coworker ID: {CoworkerId}, year: {Year}", coworkerId, year);
        return Results.Problem("Failed to retrieve yearly capacity");
    }
});

// Get current week number and year
app.MapGet("/api/calendar/current-week", (ILogger<Program> logger) =>
{
    logger.LogDebug("Current week information requested");
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
app.MapGet("/api/calendar/week-from-date", (DateTime date, ILogger<Program> logger) =>
{
    logger.LogDebug("Week number requested for date: {Date}", date);
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
/// GET /api/status - Detailed API status endpoint
/// Returns current server time, status, and version info
/// Used for frontend-backend connectivity tests
/// </summary>
app.MapGet("/api/status", (ILogger<Program> logger) =>
{
    logger.LogInformation("Status check requested");
    return Results.Json(new
    {
        status = "ok",
        timestamp = DateTime.UtcNow,
        environment = app.Environment.EnvironmentName,
        version = "1.0.0"
    });
});

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
