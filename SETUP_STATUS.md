# CapSyncer Project Setup Status

## ✅ Project is Running Successfully

### Architecture

- **Frontend**: Next.js 16.1.6 (TypeScript + Tailwind CSS) → `http://localhost:3000`
- **Backend**: ASP.NET Core 10.0 Minimal APIs → `http://localhost:5128`
- **Database**: PostgreSQL 17.6 (containerized via Aspire)
- **Orchestration**: .NET Aspire (manages all services)
- **Dashboard**: Aspire Distributed Application Dashboard → `https://localhost:17065`

### Running the Application

To start the entire application stack:

```bash
cd c:\Users\SZABO_ATT\source\repos\CapSyncer
dotnet run --project CapSyncer.AppHost/CapSyncer.AppHost.csproj
```

This automatically:

1. Starts PostgreSQL database container
2. Applies EF Core migrations
3. Starts the .NET backend API
4. Starts the Next.js frontend
5. Makes them discoverable to each other

### Database Schema

4 main tables with relationships:

#### Coworkers

- `id` (int, PK)
- `name` (string)
- `capacity` (int, hours/week)
- Relationships: Many to Many with Tasks (via Assignments)

#### Projects

- `id` (int, PK)
- `name` (string)
- Relationships: One to Many with Tasks

#### Tasks (TaskItem)

- `id` (int, PK)
- `name` (string)
- `priority` (string: Minor, Normal, High, Critical)
- `status` (string: Not started, In progress, Completed, On hold)
- `estimatedHours` (double)
- `weeklyEffort` (double)
- `added` (DateTime)
- `completed` (DateTime, nullable)
- `note` (string)
- `projectId` (int, FK)
- Relationships: FK to Projects, One to Many with Assignments

#### Assignments

- `id` (int, PK)
- `coworkerId` (int, FK)
- `taskItemId` (int, FK)
- `hoursAssigned` (double)
- `note` (string)
- `assignedDate` (DateTime)
- Relationships: FK to Coworkers and Tasks

### Backend API Endpoints

All endpoints return JSON and support CORS for `localhost:3000`

#### Health & Status

- `GET /health` → Returns empty 200 OK
- `GET /api/status` → Returns `{ status: "ok", now: "ISO datetime" }`

#### Coworkers (CRUD)

- `GET /coworkers` → List all
- `GET /coworkers/{id}` → Get one
- `POST /coworkers` → Create `{ name, capacity }`
- `PUT /coworkers/{id}` → Update
- `DELETE /coworkers/{id}` → Delete

#### Projects (CRUD)

- `GET /projects` → List all
- `GET /projects/{id}` → Get one
- `POST /projects` → Create `{ name }`
- `PUT /projects/{id}` → Update
- `DELETE /projects/{id}` → Delete

#### Tasks (CRUD)

- `GET /tasks` → List all
- `GET /tasks/{id}` → Get one
- `POST /tasks` → Create `{ name, priority, status, estimatedHours, weeklyEffort, projectId, note }`
- `PUT /tasks/{id}` → Update
- `DELETE /tasks/{id}` → Delete

#### Assignments (CRUD)

- `GET /assignments` → List all
- `GET /assignments/{id}` → Get one
- `POST /assignments` → Create `{ coworkerId, taskItemId, hoursAssigned, note }`
- `PUT /assignments/{id}` → Update
- `DELETE /assignments/{id}` → Delete

### Frontend Features

**Dashboard** (`/dashboard`):

- Tab-based interface (Team, Projects, Tasks, Capacity)
- Real-time data fetch from backend API
- Error handling and loading states
- Displays:
  - Team members with capacity indicators
  - Project list
  - Task list with status and priority
  - Assignments with hour allocations

### Configuration Files

#### Backend

- `backend/Program.cs` - Service registration, middleware, CRUD endpoints
- `backend/Models/CapSyncerDbContext.cs` - DbContext and all entity models
- `backend/appsettings.json` - Database connection string (PostgreSQL)
- `backend/Migrations/` - EF Core migrations (auto-applied on startup)

#### AppHost (Orchestration)

- `CapSyncer.AppHost/AppHost.cs` - Defines all services with Aspire
  - PostgreSQL with persistent volume
  - Backend with database reference
  - Frontend with API URL injection
  - All endpoints properly configured

#### Frontend

- `frontend/app/dashboard/page.tsx` - Main dashboard component
- `frontend/app/page.tsx` - Home page with navigation

### Testing the API

Using PowerShell:

```powershell
# Get all coworkers
Invoke-WebRequest -Uri "http://localhost:5128/coworkers" -UseBasicParsing | Select-Object -ExpandProperty Content

# Create a new coworker
$body = @{ Name = "John Doe"; Capacity = 40 } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5128/coworkers" -Method Post `
  -UseBasicParsing -Headers @{"Content-Type"="application/json"} -Body $body

# Get all projects
Invoke-WebRequest -Uri "http://localhost:5128/projects" -UseBasicParsing | Select-Object -ExpandProperty Content
```

### Current Sample Data

The application currently has:

- **5 Coworkers**: Alice Johnson, Bob Smith, Carol Davis (× 2 due to duplicates)
- **1 Project**: "Web Portal Redesign"
- **2 Tasks**: "Design mockups", "Backend API implementation"
- **1 Assignment**: Links data between coworkers and tasks

### Known Information

- **PostgreSQL Host**: `localhost:5432`
- **PostgreSQL Database**: `capsyncerdb`
- **PostgreSQL Credentials**: `postgres:postgres` (configured in appsettings.json)
- **Frontend Port**: `3000`
- **Backend Port**: `5128`
- **Aspire Dashboard Port**: `17065`
- **CORS Policy**: Allows `localhost:3000` and `localhost:3001`

### Troubleshooting

#### Backend not starting

1. Kill any lingering dotnet processes: `Get-Process dotnet | Stop-Process -Force`
2. Delete `bin` and `obj` folders if build cache is corrupted
3. Rebuild: `dotnet build backend/CapSyncer.Server.csproj`

#### Database connection issues

- Verify PostgreSQL container is running: `docker ps`
- Check connection string in `backend/appsettings.json`
- Migration runs automatically on startup; check console for errors

#### Frontend not connecting to API

- Verify backend is responding: `curl http://localhost:5128/health`
- Check `NEXT_PUBLIC_API_BASEURL` is set correctly by Aspire
- Check browser console for CORS or fetch errors

### Next Steps for Development

1. **Add authentication** - Implement user/role management
2. **Enhance dashboard** - Add charts, filtering, sorting
3. **Add validation** - Implement fluent validators for input
4. **Add logging** - Configure structured logging (Serilog)
5. **Add testing** - Unit tests with xUnit, integration tests
6. **Production deployment** - Set up CI/CD, configure for cloud hosting

---

Generated: February 27, 2026
Status: ✅ Fully Operational
