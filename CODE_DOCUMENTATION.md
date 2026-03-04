# CapSyncer Code Documentation

> Comprehensive guide to the CapSyncer codebase architecture and conventions

**Last Updated:** March 4, 2026  
**Version:** 1.0.0

**⚠️ Important Notes:**

- Development uses **.NET Aspire 13.1.2** for orchestration (not Docker)
- Docker files are for **production deployment only**
- Tech stack: .NET 10, Next.js 16.1.6, React 19.2.3, Tailwind CSS 4
- No external UI component library (custom components)

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Data Models](#data-models)
- [API Design](#api-design)
- [State Management](#state-management)
- [Styling Conventions](#styling-conventions)
- [Monitoring & Observability](#monitoring--observability)
- [Testing Strategy](#testing-strategy)
- [Code Conventions](#code-conventions)

---

## 🏗️ Architecture Overview

CapSyncer follows a **modern n-tier architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────┐
│              Frontend (Next.js)                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Pages (App Router)                       │  │
│  │  ├── layout.tsx (Root Layout + SEO)      │  │
│  │  ├── page.tsx (Home/Landing)             │  │
│  │  └── [entity]/[id]/ (Detail Pages)       │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Components                               │  │
│  │  ├── UI Components (shadcn/ui)           │  │
│  │  ├── Business Components                 │  │
│  │  └── Layout Components                   │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Contexts (React Context API)            │  │
│  │  └── PermissionContext                   │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ▼ HTTP/REST
┌─────────────────────────────────────────────────┐
│         Backend (.NET Minimal APIs)              │
│  ┌──────────────────────────────────────────┐  │
│  │  Program.cs (API Endpoints)              │  │
│  │  ├── Coworkers (6 endpoints)             │  │
│  │  ├── Projects (5 endpoints)              │  │
│  │  ├── Tasks (5 endpoints)                 │  │
│  │  ├── Assignments (5 endpoints)           │  │
│  │  ├── Capacity (4 endpoints)              │  │
│  │  └── Health (2 endpoints)                │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Models (EF Core)                        │  │
│  │  ├── Coworker                            │  │
│  │  ├── Project                             │  │
│  │  ├── TaskItem                            │  │
│  │  ├── Assignment                          │  │
│  │  └── CapSyncerDbContext                  │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ▼ EF Core
┌─────────────────────────────────────────────────┐
│            PostgreSQL Database                   │
│  Tables: Coworkers, Projects, Tasks,            │
│          Assignments                            │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Backend Architecture

### Technology Stack

- **.NET 10.0** - Latest runtime
- **ASP.NET Core Minimal APIs** - Lightweight HTTP APIs
- **Entity Framework Core 10.0** - ORM
- **Npgsql** - PostgreSQL provider
- **xUnit** - Testing framework

### File Structure

```
backend/
├── Program.cs              # API endpoints, DI, middleware
├── appsettings.json        # Configuration
├── appsettings.Development.json
├── CapSyncer.Server.csproj # Project file
├── CapSyncer.Server.http   # HTTP test file
├── Dockerfile              # Container definition
├── .dockerignore           # Docker build exclusions
├── .env.example            # Environment template
└── Models/
    └── CapSyncerDbContext.cs  # EF Core models
```

### Program.cs Architecture

**Program.cs** contains all API logic in ~600 lines, organized into sections:

1. **Service Configuration** (Lines 1-60)
   - JSON serialization (circular reference handling)
   - DbContext (InMemory for testing, PostgreSQL for dev/prod)
   - CORS policies (DevCors, ProdCors)

2. **Middleware Pipeline** (Lines 61-150)
   - HTTPS redirection (production only)
   - CORS
   - Database auto-creation and migration (development)

3. **API Endpoints** (Lines 151-550)
   - Coworkers (6 endpoints) - Lines 155-250
   - Projects (5 endpoints) - Lines 256-350
   - Tasks (5 endpoints) - Lines 356-390
   - Assignments (5 endpoints) - Lines 391-433
   - Capacity (4 endpoints) - Lines 434-547
   - Health (2 endpoints) - Lines 548-556

4. **Helper Methods** (Lines 557-600)
   - ISO week calculation

### Data Access Patterns

**Read Operations:**

```csharp
// Simple get
await db.Coworkers.ToListAsync();

// Get with includes
await db.Projects
    .Include(p => p.Tasks)
    .ToListAsync();

// Find by ID
await db.Coworkers.FindAsync(id);

// Query with filter
await db.Assignments
    .Where(a => a.Year == year && a.WeekNumber == weekNumber)
    .ToListAsync();
```

**Write Operations:**

```csharp
// Create
db.Coworkers.Add(coworker);
await db.SaveChangesAsync();

// Update (detached pattern)
var existing = await db.Coworkers.AsNoTracking().FirstOrDefaultAsync();
var updated = new Coworker { Id = id, Name = newName, /* ... */ };
db.Coworkers.Update(updated);
await db.SaveChangesAsync();

// Delete
var entity = await db.Coworkers.FindAsync(id);
db.Coworkers.Remove(entity);
await db.SaveChangesAsync();
```

### Validation Rules

**Task Validation:**

```csharp
// WeeklyEffort must be > 0
if (t.WeeklyEffort <= 0)
{
    return Results.BadRequest("WeeklyEffort must be greater than 0");
}
```

**ID Validation:**

```csharp
// Prevent ID mismatch in updates
if (input.Id != 0 && input.Id != id)
{
    return Results.BadRequest(new { error = "ID mismatch" });
}
```

### Soft Delete Pattern

```csharp
// Coworkers use soft delete
app.MapDelete("/api/coworkers/{id}", async (int id, CapSyncerDbContext db) =>
{
    var c = await db.Coworkers.FindAsync(id);
    if (c is null) return Results.NotFound();

    if (c.IsActive)
    {
        // First call: soft delete
        c.IsActive = false;
        await db.SaveChangesAsync();
        return Results.Ok(new { message = "soft-delete", coworker = c });
    }
    else
    {
        // Second call: hard delete
        db.Coworkers.Remove(c);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
});
```

### Cascade Delete Pattern

```csharp
// Project delete cascades to Tasks and Assignments
var p = await db.Projects
    .Include(p => p.Tasks)
    .ThenInclude(t => t.Assignments)
    .FirstOrDefaultAsync(p => p.Id == id);

// Manually cascade for InMemory database compatibility
foreach (var task in p.Tasks.ToList())
{
    db.Assignments.RemoveRange(task.Assignments);
    db.Tasks.Remove(task);
}

db.Projects.Remove(p);
await db.SaveChangesAsync();
```

---

## 🎨 Frontend Architecture

### Technology Stack

- **Next.js 16.1.6** - React framework with App Router
- **React 19.2.3** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first CSS
- **Custom Components** - No external component library (custom Button, Modal, Table, etc.)

### File Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout + SEO
│   ├── page.tsx           # Home/Landing page
│   ├── globals.css        # Global styles
│   ├── dashboard/
│   │   └── page.tsx       # Main dashboard
│   ├── tasks/[id]/
│   │   └── page.tsx       # Task detail
│   ├── projects/[id]/
│   │   └── page.tsx       # Project detail
│   ├── coworkers/[id]/
│   │   └── page.tsx       # Coworker detail
│   └── assignments/[id]/
│       └── page.tsx       # Assignment detail
├── components/             # Custom React components
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── Table.tsx
│   ├── CreateTaskModal.tsx
│   ├── WeeklyCapacityView.tsx
│   └── PageLayout.tsx
├── contexts/
│   └── PermissionContext.tsx
├── public/                # Static assets
├── next.config.ts         # Next.js config
├── tsconfig.json          # TypeScript config
├── tailwind.config.ts     # Tailwind config
├── package.json
├── Dockerfile
├── .dockerignore
└── .env.example
```

### Page Architecture (App Router)

**Root Layout** (`app/layout.tsx`):

- Defines HTML structure
- Includes SEO metadata (Open Graph, Twitter Cards)
- Sets up PermissionContext
- Configures canonical URLs

**Dynamic Routes:**

```typescript
// Pattern: app/[entity]/[id]/page.tsx
// Example: /tasks/123 → app/tasks/[id]/page.tsx

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const taskId = parseInt(params.id);
  // Fetch and display task data
}
```

### Data Fetching Pattern

**Client-side fetching** (not using server components for this SPA-style app):

```typescript
const [data, setData] = useState<EntityType[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/endpoint`,
      );
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
```

### Component Patterns

**Modal Components:**

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: EntityType;
}

export function CreateEditModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: ModalProps) {
  // Form state and validation
  // Submit handler with API call
  // Return modal JSX
}
```

**Table Components:**

```typescript
interface TableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}
```

---

## 📊 Data Models

### Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────┐
│   Coworker   │         │   Project    │
├──────────────┤         ├──────────────┤
│ Id (PK)      │         │ Id (PK)      │
│ Name         │         │ Name         │
│ Capacity     │         │ Status       │
│ IsActive     │         │ CreatedAt    │
└──────┬───────┘         └──────┬───────┘
       │                        │
       │ 1:N                    │ 1:N
       │                        │
       │    ┌──────────────┐    │
       └────│   TaskItem   │────┘
            ├──────────────┤
            │ Id (PK)      │
            │ Name         │
            │ Priority     │
            │ Status       │
            │ WeeklyEffort │
            │ ProjectId(FK)│
            └──────┬───────┘
                   │
                   │ 1:N
                   │
            ┌──────────────┐
            │  Assignment  │
            ├──────────────┤
            │ Id (PK)      │
            │ CoworkerId(FK)│
            │ TaskItemId(FK)│
            │ HoursAssigned│
            │ Year         │
            │ WeekNumber   │
            └──────────────┘
```

### Model Definitions

**Coworker:**

```csharp
public class Coworker
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public int Capacity { get; set; }  // Weekly hours
    public bool IsActive { get; set; } = true;  // Soft delete flag
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
```

**Project:**

```csharp
public class Project
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Status { get; set; } = "Planning";  // Default status
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}
```

**TaskItem:**

```csharp
public class TaskItem
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Priority { get; set; } = "Normal";
    public string Status { get; set; } = "Planning";  // Default status
    public int EstimatedHours { get; set; }
    public int WeeklyEffort { get; set; }  // Must be > 0
    public string? Note { get; set; }
    public int? ProjectId { get; set; }
    public Project? Project { get; set; }
    public DateTime Added { get; set; } = DateTime.UtcNow;
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
```

**Assignment:**

```csharp
public class Assignment
{
    public int Id { get; set; }
    public int CoworkerId { get; set; }
    public Coworker Coworker { get; set; } = null!;
    public int TaskItemId { get; set; }
    public TaskItem TaskItem { get; set; } = null!;
    public int HoursAssigned { get; set; }
    public string? Note { get; set; }
    public DateTime AssignedDate { get; set; }
    public string? AssignedBy { get; set; }
    public int Year { get; set; }
    public int WeekNumber { get; set; }  // ISO 8601 week number
}
```

---

## 🎯 API Design

### RESTful Conventions

**HTTP Methods:**

- `GET` - Retrieve data (idempotent, cacheable)
- `POST` - Create new resource
- `PUT` - Update existing resource (full replacement)
- `DELETE` - Delete resource

**Status Codes:**

- `200 OK` - Successful GET/DELETE (with body)
- `201 Created` - Successful POST
- `204 No Content` - Successful PUT/DELETE (no body)
- `400 Bad Request` - Validation error
- `404 Not Found` - Resource doesn't exist

### Endpoint Naming

Pattern: `/api/{resource}` or `/api/{resource}/{id}`

Examples:

- `/api/coworkers` - Collection
- `/api/coworkers/5` - Specific item
- `/api/capacity/weekly/5/2026` - Hierarchical resource

---

## 🔄 State Management

### React Context (PermissionContext)

```typescript
// contexts/PermissionContext.tsx
interface PermissionContextType {
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
}

export function PermissionProvider({ children }: { children: ReactNode }) {
  const value = {
    canEdit: true,
    canDelete: true,
    canCreate: true,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

// Usage in components
const { canEdit } = usePermissions();
```

---

## 🎨 Styling Conventions

### Status Badge Colors

```typescript
const statusColors = {
  Planning: "bg-blue-100 text-blue-800 border-blue-200",
  "In Progress": "bg-green-100 text-green-800 border-green-200",
  "On Hold": "bg-yellow-100 text-yellow-800 border-yellow-200",
  Completed: "bg-purple-100 text-purple-800 border-purple-200",
  Continuous: "bg-cyan-100 text-cyan-800 border-cyan-200",
  Cancelled: "bg-red-100 text-red-800 border-red-200",
};
```

### Priority Colors

```typescript
const priorityColors = {
  Emergency: "text-red-600",
  High: "text-orange-600",
  Normal: "text-blue-600",
  Low: "text-gray-600",
};
```

---

## 📊 Monitoring & Observability

### Overview

CapSyncer implements comprehensive monitoring through:

- **Backend**: .NET Aspire + OpenTelemetry (automatic distributed tracing)
- **Frontend**: ErrorBoundary + Logger utility (manual + automatic error tracking)
- **Health Checks**: Database connectivity and service health monitoring

### Backend Monitoring (Aspire + OpenTelemetry)

**Implementation:**

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults(); // Enables OpenTelemetry + Health Checks

var app = builder.Build();
app.MapDefaultEndpoints(); // Adds /health, /alive endpoints
```

**What's Automatically Tracked:**

1. **HTTP Requests**
   - Request duration, status codes, routes
   - Visible in Aspire Dashboard > Resources tab

2. **Database Queries**
   - EF Core query timing and text
   - Connection pool stats
   - Visible in Aspire Dashboard > Traces tab

3. **Distributed Traces**
   - Full request flow visualization
   - Dependencies between services
   - Visible in Aspire Dashboard > Traces tab

4. **Runtime Metrics**
   - CPU usage, memory, GC collections
   - Thread pool utilization
   - Visible in Aspire Dashboard > Metrics tab

5. **Structured Logs**
   - JSON-formatted with timestamps
   - Searchable by level, message, context
   - Visible in Aspire Dashboard > Console + Structured tabs

**Configuration:**

```json
// appsettings.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore.Database.Command": "Warning"
    },
    "Console": {
      "FormatterName": "json",
      "FormatterOptions": {
        "TimestampFormat": "yyyy-MM-ddTHH:mm:ss.fffZ",
        "UseUtcTimestamp": true,
        "IncludeScopes": true
      }
    }
  },
  "HealthChecks": {
    "UI": {
      "EvaluateHealthChecksAfter": 10
    }
  }
}
```

**Health Endpoints:**

- `GET /health` - Liveness probe (200 OK if healthy)
- `GET /alive` - Readiness probe (200 OK if ready)
- `GET /api/status` - Detailed status (timestamp, environment, version)

**Accessing Aspire Dashboard:**

```powershell
cd CapSyncer.AppHost
dotnet run  # Opens dashboard at http://localhost:17xxx
```

Dashboard provides real-time visibility into:

- Service status and logs
- Request traces and timing
- Performance metrics and trends
- Health check results

### Frontend Monitoring

#### ErrorBoundary Component

**Purpose**: Catch all React component errors to prevent app crashes

**Implementation:**

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <PermissionProvider>{children}</PermissionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

**Features:**

- Catches errors in any React component
- Shows user-friendly fallback UI with refresh button
- Logs error details in development (console)
- Ready for production service integration (Sentry, LogRocket)
- Captures component stack traces

**Location**: `frontend/components/ErrorBoundary.tsx`

#### Logger Utility

**Purpose**: Centralized client-side logging with structured format

**Usage:**

```typescript
import { logger } from "@/utils/logger";

// Basic logging
logger.info("User action completed", { userId: 123, action: "create-task" });
logger.warn("API rate limit approaching", { remaining: 5 });
logger.error("Operation failed", error, { context: "task-save" });
logger.debug("Debug info", { state: currentState }); // Dev only

// API-specific logging
logger.logApiError("/api/tasks", "POST", 500, error, { taskId: 456 });
logger.logFetchError("/api/coworkers", networkError);

// Fetch with automatic logging
const response = await fetchWithLogging("/api/tasks", { method: "GET" });
```

**Features:**

- Structured log format (timestamp, level, message, context)
- Environment-aware (verbose in dev, errors only in prod)
- Automatic context capture (URL, user agent, timestamp)
- Ready for external service integration
- Type-safe with TypeScript

**Location**: `frontend/utils/logger.ts`

### Production Integration

**Backend:**

1. **Azure Application Insights**:

   ```csharp
   // Uncomment in CapSyncer.ServiceDefaults/Extensions.cs
   builder.Services.AddApplicationInsightsTelemetry();
   ```

2. **Configure connection string**:
   ```json
   {
     "ApplicationInsights": {
       "ConnectionString": "InstrumentationKey=..."
     }
   }
   ```

**Frontend:**

1. **Install Sentry**:

   ```bash
   npm install @sentry/nextjs
   ```

2. **Initialize**:

   ```typescript
   // sentry.client.config.ts
   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     tracesSampleRate: 1.0,
   });
   ```

3. **Update ErrorBoundary and logger to send to Sentry**

See [MONITORING.md](MONITORING.md) for complete setup guide.

---

## 🧪 Testing Strategy

### Test Pyramid

```
        ┌─────────────┐
        │   E2E (?)    │  ← Playwright (if implemented)
        └─────────────┘
      ┌─────────────────┐
      │ Integration (70) │  ← xUnit + InMemory DB
      └─────────────────┘
    ┌───────────────────────┐
    │    Unit Tests (42)    │  ← xUnit
    └───────────────────────┘
```

**Total: 112 tests (100% passing)**

### Backend Testing

**Unit Tests:**

- Focus: Models, business logic, helpers
- Framework: xUnit
- Mocking: Not required (simple logic)

**Integration Tests:**

- Focus: API endpoints, database operations
- Framework: xUnit + WebApplicationFactory
- Database: InMemory (unique per test)

**Test Structure:**

```csharp
public class EntityIntegrationTests : IAsyncLifetime
{
    private WebApplicationFactory<Program> _factory;
    private HttpClient _client;

    public async Task InitializeAsync()
    {
        _factory = new WebApplicationFactory<Program>();
        _client = _factory.CreateClient();
        // Setup test data
    }

    [Fact]
    public async Task EndpointName_Scenario_ExpectedResult()
    {
        // Arrange
        // Act
        // Assert
    }
}
```

---

## 📝 Code Conventions

### C# Conventions

- **Naming:** PascalCase for public members, camelCase for private
- **Async:** Always use `async`/`await`, suffix methods with `Async`
- **Nullability:** Enabled, use `?` for nullable types
- **Comments:** XML comments for public APIs, inline for complex logic

### TypeScript Conventions

- **Naming:** camelCase for variables/functions, PascalCase for components/types
- **Types:** Explicit interfaces for props, inferred for simple variables
- **Async:** Use `async`/`await`, not `.then()`
- **Components:** Functional components only, use hooks

### File Naming

- **C#:** PascalCase - `CapSyncerDbContext.cs`
- **TypeScript:** PascalCase for components - `CreateTaskModal.tsx`
- **TypeScript:** kebab-case for utilities - `date-utils.ts`

---

**Last Updated:** March 4, 2026
**Version:** 1.0.0
