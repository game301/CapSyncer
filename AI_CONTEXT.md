# CapSyncer - AI Agent Context & Memory

> **Last Updated:** March 4, 2026
>
> This document serves as a persistent memory for AI agents working on this project. It contains critical project context, conventions, and recent changes to ensure consistency across sessions.
>
> **⚠️ IMPORTANT:** Keep this file updated whenever making changes to the project. This is the primary reference for understanding the current state of CapSyncer.

---

## 📋 Project Overview

**CapSyncer** is a modern team capacity management system for tracking projects, tasks, and team member assignments.

- **Backend**: .NET 10.0 Minimal APIs with EF Core 10.0.3
- **Frontend**: Next.js 16.1.6 (App Router) with TypeScript and Tailwind CSS 4
- **Orchestration**: .NET Aspire 13.1.2 (development)
- **Database**: PostgreSQL 17.6 (production/dev) / InMemory (testing)
- **Testing**: xUnit with 112 tests (100% passing)

---

## 🎯 Core Business Logic

### Status Values (CRITICAL - Recently Standardized)

**Task Statuses:**

- `"Planning"` - Default for new tasks (NOT "Not started")
- `"In Progress"` - Active work (proper title case)
- `"On Hold"` - Temporarily paused
- `"Completed"` - Finished
- `"Continuous"` - Ongoing maintenance tasks
- `"Cancelled"` - Abandoned

**Project Statuses:**

- `"Planning"` - Default for new projects
- `"In Progress"`
- `"On Hold"`
- `"Completed"`
- `"Cancelled"`

⚠️ **NEVER use:**

- "Active" (removed - was incorrectly used)
- "Not started" or "Not Started" (replaced with "Planning")
- "In progress" (lowercase - use "In Progress")

### Validation Rules

1. **Task WeeklyEffort**: MUST be > 0 (validated on POST/PUT)
2. **Capacity**: Coworker capacity must be positive
3. **Soft Delete**: Coworkers are soft-deleted (IsActive flag)
4. **Cascade Delete**: Projects cascade to Tasks, Tasks cascade to Assignments

---

## 🏗️ Architecture & Patterns

### Backend Structure

```
backend/
├── Program.cs              # Minimal API endpoints, DB config, CORS
├── Models/
│   └── CapSyncerDbContext.cs  # EF Core models & relationships
├── CapSyncer.Server.http   # HTTP test file (27 endpoints)
└── appsettings.json        # Configuration
```

### Frontend Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with SEO metadata
│   ├── page.tsx           # Dashboard (main page)
│   ├── dashboard/         # Same as main page
│   ├── tasks/[id]/        # Task detail pages
│   ├── projects/[id]/     # Project detail pages
│   ├── coworkers/[id]/    # Coworker detail pages
│   └── assignments/[id]/  # Assignment detail pages
├── components/            # Reusable React components
│   ├── CreateTaskModal.tsx
│   ├── WeeklyCapacityView.tsx
│   └── ui/               # shadcn/ui components
└── contexts/             # React Context providers
    └── PermissionContext.tsx
```

### API Endpoints (27 Total)

**Health & Status:**

- `GET /health`
- `GET /api/status`

**Coworkers (6):**

- `GET /api/coworkers` - List all
- `GET /api/coworkers/{id}` - Get by ID
- `POST /api/coworkers` - Create
- `PUT /api/coworkers/{id}` - Update
- `DELETE /api/coworkers/{id}` - Soft delete (hard delete on 2nd call)
- `PUT /api/coworkers/{id}/reactivate` - Restore soft-deleted

**Projects (5):**

- `GET /api/projects` - List all with tasks
- `GET /api/projects/{id}` - Get by ID
- `POST /api/projects` - Create (defaults to "Planning" status)
- `PUT /api/projects/{id}` - Update
- `DELETE /api/projects/{id}` - Delete (cascades to tasks)

**Tasks (5):**

- `GET /api/tasks` - List all
- `GET /api/tasks/{id}` - Get by ID
- `POST /api/tasks` - Create (requires WeeklyEffort > 0)
- `PUT /api/tasks/{id}` - Update (requires WeeklyEffort > 0)
- `DELETE /api/tasks/{id}` - Delete (cascades to assignments)

**Assignments (5):**

- `GET /api/assignments` - List all with includes
- `GET /api/assignments/{id}` - Get by ID
- `POST /api/assignments` - Create
- `PUT /api/assignments/{id}` - Update
- `DELETE /api/assignments/{id}` - Delete

**Capacity (4):**

- `GET /api/capacity/weekly?year={year}&weekNumber={weekNumber}` - All coworkers for a week
- `GET /api/capacity/weekly/{coworkerId}/{year}` - Coworker's year
- `GET /api/capacity/current-week` - Current ISO week info
- `GET /api/capacity/week-from-date?date={date}` - Convert date to week

---

## 🔧 Configuration & Environment

### Backend Configuration

**Connection String (appsettings.json):**

```json
"ConnectionStrings": {
  "capsyncerdb": "Host=localhost;Port=5432;Database=capsyncerdb;Username=postgres;Password=postgres"
}
```

**Environment Detection:**

- `Testing` → InMemory database (unique per test run)
- `Development`/`Production` → PostgreSQL

**CORS Policies:**

- `DevCors`: http://localhost:3000, http://localhost:3001
- `ProdCors`: https://your-production-domain.com (update for actual domain)

### Frontend Configuration

**Environment Variables:**

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:5128)
- `NEXT_PUBLIC_BASE_URL` - Frontend base URL for SEO

---

## 🧪 Testing

### Test Structure

```
CapSyncer.Server.Tests/
├── Integration/              # 70+ integration tests
│   ├── ProjectsIntegrationTests.cs
│   ├── TasksIntegrationTests.cs
│   ├── AssignmentsIntegrationTests.cs
│   └── CapacityIntegrationTests.cs
├── Unit/                     # 42+ unit tests
│   ├── ProjectTests.cs
│   └── TaskTests.cs
└── TasksApiTests.cs          # Additional API tests
```

**Running Tests:**

```powershell
dotnet test --nologo
# Or with coverage
dotnet test --collect:"XPlat Code Coverage"
```

**Current Status:** 114/114 tests passing (100%)

---

## 📝 Recent Changes & Decisions (Session History)

### March 4, 2026 - Documentation Corrections & Accuracy Updates

**Corrections Made:**

1. ✅ Fixed technology versions to match actual project:
   - Next.js: 16.1.6 (was incorrectly listed as 15.1.6)
   - React: 19.2.3 (was listed as 19)
   - Tailwind CSS: 4 (was listed as 3.4)
   - Entity Framework Core: 10.0.3 (was listed as 10.0)
   - .NET Aspire: 13.1.2 (added version number)
2. ✅ Removed incorrect shadcn/ui references - project uses custom components
3. ✅ Clarified development workflow:
   - **Development**: Aspire orchestration (PostgreSQL in Docker, backend/frontend native)
   - **Production**: Full Docker containerization (optional)
4. ✅ Updated all documentation files with correct information
5. ✅ Added documentation maintenance rules and reminders
6. ✅ Emphasized that Docker files are for production deployment only

**Documentation Files Updated:**

- AI_CONTEXT.md (this file)
- README.md
- CODE_DOCUMENTATION.md
- DEPLOYMENT.md

### March 4, 2026 - Status Standardization & Validation

**Changes Made:**

1. ✅ Added WeeklyEffort validation (must be > 0) on task POST/PUT
2. ✅ Fixed project default status from "Active" → "Planning"
3. ✅ Standardized all status naming:
   - "Not started" → "Planning" (28 occurrences across 18 files)
   - "In progress" → "In Progress" (15+ occurrences)
4. ✅ Resolved file locking build issue (killed process 21428)
5. ✅ Updated HTTP test file with correct status values
6. ✅ Added missing capacity endpoint to HTTP file

**Files Modified (18 total):**

- Backend: Program.cs, CapSyncerDbContext.cs, 9 test files
- Frontend: 5 pages, 2 components

**Test Results:**

- Before: 111/111 passing
- After validation: 112/112 passing
- Final: 114/114 passing (100%)

---

## 🎨 UI/UX Conventions

### Status Badge Colors

```typescript
// Planning - Blue
className = "bg-blue-100 text-blue-800 border-blue-200";

// In Progress - Green
className = "bg-green-100 text-green-800 border-green-200";

// On Hold - Yellow
className = "bg-yellow-100 text-yellow-800 border-yellow-200";

// Completed - Purple
className = "bg-purple-100 text-purple-800 border-purple-200";

// Continuous - Cyan
className = "bg-cyan-100 text-cyan-800 border-cyan-200";

// Cancelled - Red
className = "bg-red-100 text-red-800 border-red-200";
```

### Priority Colors

- Emergency: Red
- High: Orange
- Normal: Blue
- Low: Gray

---

## ⚠️ Known Issues & Gotchas

1. **File Locking**: .NET Host processes can lock DLL files during hot reload. Solution: Kill dotnet processes and run `dotnet clean`.

2. **VS Code Error Panel**: May show cached errors after successful builds. Reload window or run build again.

3. **Test Database**: Each test run uses unique InMemory database (prevents interference).

4. **CORS in Production**: Remember to update ProdCors policy with actual production domain.

---

## 🚀 Development Workflow

### Starting the Application

**Primary Method: Aspire Orchestration (Recommended)**

```powershell
dotnet run --project CapSyncer.AppHost
```

This single command:

- ✅ Starts PostgreSQL container (via Aspire.Hosting.PostgreSQL)
- ✅ Starts backend API (http://localhost:5128)
- ✅ Starts frontend (http://localhost:3000)
- ✅ Opens Aspire Dashboard (dynamically assigned port, typically http://localhost:17xxx)
- ✅ Auto-creates database and runs migrations
- ✅ Handles service discovery and health monitoring

**Alternative: Manual Development (Not Recommended)**

```powershell
# Terminal 1: Start PostgreSQL only
docker-compose up -d postgres

# Terminal 2: Start backend
cd backend
dotnet run

# Terminal 3: Start frontend
cd frontend
npm run dev
```

**Docker Containers:** Only used for PostgreSQL in development. Backend and frontend run natively via Aspire or manual dotnet/npm commands. Full containerization is for production deployment only.

### Running Tests

```powershell
cd backend
dotnet test --nologo
```

### Building

```powershell
dotnet build --nologo
```

---

## 📚 Documentation Files

**Core Documentation (Keep Updated):**

- `AI_CONTEXT.md` - **This file** - Primary reference, update FIRST when anything changes
- `README.md` - Project overview and quick start
- `CODE_DOCUMENTATION.md` - Architecture, patterns, and code conventions
- `DEPLOYMENT.md` - Production deployment guide (Docker-based)

**API & Development:**

- `backend/CapSyncer.Server.http` - HTTP test file with all 27 endpoints
- `API_GUIDE_AND_CLEANUP.md` - API documentation and notes

**Testing & Database:**

- `TESTING.md` - Complete testing guide
- `HOW_TO_VIEW_DATABASE.md` - Database access guide
- `FULL_TEST_REPORT.md` - Detailed test results

**Project Management:**

- `PROJECT_STATUS.md` - Project status tracking
- `SETUP_STATUS.md` - Setup completion checklist

**Docker Files (Production Only - NOT for Development):**

- `docker-compose.yml` - Full stack orchestration
- `backend/Dockerfile` - Backend container
- `frontend/Dockerfile` - Frontend container
- `backend/.dockerignore` & `frontend/.dockerignore`
- **Note:** Development uses .NET Aspire, not Docker containers

**Environment Templates:**

- `backend/.env.example` - Backend configuration template
- `frontend/.env.example` - Frontend configuration template

---

## 📝 Documentation Maintenance Rules

**When making changes to the project:**

1. ✅ Update `AI_CONTEXT.md` FIRST - This is the source of truth
2. ✅ Update related MD files (README, CODE_DOCUMENTATION, DEPLOYMENT)
3. ✅ Update version numbers if dependencies change
4. ✅ Update test counts if tests are added/removed
5. ✅ Update HTTP file if API endpoints change
6. ✅ Keep "Last Updated" dates current

**Remember:** Documentation should always reflect the current state of the code.

---

## 🔄 Update Instructions for AI Agents

When working on this project:

1. **Always check status values** - Use "Planning" and "In Progress" (never "Not started" or "In progress")
2. **Validate WeeklyEffort** - Must be > 0 for tasks
3. **Update this file** - Add new decisions, changes, or conventions
4. **Run tests** - Verify changes with `dotnet test`
5. **Check HTTP file** - Update examples when API changes
6. **Update test count** - If tests added/removed

---

## 📞 Quick Reference

**Default Port Numbers:**

- Backend API: `5128`
- Frontend: `3000`
- PostgreSQL: `5432`

**Default Credentials (Dev):**

- PostgreSQL: `postgres` / `postgres`
- Database: `capsyncerdb`

**Key Dependencies:**

- .NET 10.0
- Entity Framework Core 10.0.3
- .NET Aspire 13.1.2
- Next.js 16.1.6
- React 19.2.3
- TypeScript 5
- Tailwind CSS 4
- Custom UI components (no external component library)
