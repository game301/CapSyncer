
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
                      "Host=127.0.0.1;Port=5432;Database=capsyncerdb;Username=postgres;Password=postgres"));

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
    c.IsActive = true; // New coworkers are active by default
    db.Coworkers.Add(c);
    await db.SaveChangesAsync();
    return Results.Created($"/api/coworkers/{c.Id}", c);
});
app.MapPut("/api/coworkers/{id}", async (int id, Coworker input, CapSyncerDbContext db) =>
{
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
    return Results.Ok(coworkerToUpdate);
});
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
        return Results.Ok(new { message = "permanent-delete" });
    }
});
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
    return Results.Ok(projectToUpdate);
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
    var t = await db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id);
    if (t is null) return Results.NotFound();
    
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
    return Results.Ok(taskToUpdate);
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
    return Results.Ok(assignmentToUpdate);
});
app.MapDelete("/api/assignments/{id}", async (int id, CapSyncerDbContext db) =>
{
    var a = await db.Assignments.FindAsync(id);
    if (a is null) return Results.NotFound();
    db.Assignments.Remove(a);
    await db.SaveChangesAsync();
    return Results.NoContent();
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

// Basic health endpoint required by the AppHost health check
app.MapGet("/health", () => Results.Ok());

// Simple API endpoint for frontend-backend communication tests
app.MapGet("/api/status", () => Results.Json(new { status = "ok", now = DateTime.UtcNow }));

app.Run();

// Helper method to calculate ISO week number
static (int Year, int WeekNumber) GetIsoWeekNumber(DateTime date)
{
    // ISO 8601 week date system:
    // Week 1 is the first week with a Thursday in it
    var thursday = date.AddDays(3 - ((int)date.DayOfWeek + 6) % 7);
    int year = thursday.Year;
    int weekNumber = (thursday.DayOfYear - 1) / 7 + 1;
    return (year, weekNumber);
}
