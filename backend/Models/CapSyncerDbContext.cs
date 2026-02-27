using Microsoft.EntityFrameworkCore;

namespace CapSyncer.Server.Models
{
    public class CapSyncerDbContext : DbContext
    {
        public CapSyncerDbContext(DbContextOptions<CapSyncerDbContext> options) : base(options) { }

        public DbSet<Coworker> Coworkers { get; set; } = null!;
        public DbSet<Project> Projects { get; set; } = null!;
        public DbSet<TaskItem> Tasks { get; set; } = null!;
        public DbSet<Assignment> Assignments { get; set; } = null!;
    }

    public class Coworker
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Capacity { get; set; } // e.g. hours per week
        public bool IsActive { get; set; } = true; // Soft delete flag
        public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
    }

    public class Project
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    }

    public class TaskItem
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Priority { get; set; } = "Normal"; // Minor, Critical, High, etc.
        public string Status { get; set; } = "Not started"; // In progress, Continuous, etc.
        public double EstimatedHours { get; set; }
        public double WeeklyEffort { get; set; }
        public DateTime Added { get; set; } = DateTime.UtcNow;
        public DateTime? Completed { get; set; }
        public string Note { get; set; } = string.Empty;
        public int ProjectId { get; set; }
        public Project? Project { get; set; }
        public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
    }

    public class Assignment
    {
        public int Id { get; set; }
        public int CoworkerId { get; set; }
        public Coworker? Coworker { get; set; }
        public int TaskItemId { get; set; }
        public TaskItem? TaskItem { get; set; }
        public double HoursAssigned { get; set; }
        public string Note { get; set; } = string.Empty;
        public DateTime AssignedDate { get; set; } = DateTime.UtcNow;
        public string AssignedBy { get; set; } = string.Empty; // Who assigned this task
    }
}
