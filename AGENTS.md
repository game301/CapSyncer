# AI AGENT GUIDE - CapSyncer Project

> **PRIMARY AI CONTEXT FILE** - This document contains critical information for AI agents working on CapSyncer.
> Optimized for LLM consumption with structured, actionable information.

---

## 🎯 QUICK REFERENCE (Critical Facts)

**Project Type:** Team capacity management system (tracks coworkers, projects, tasks, assignments)

**Tech Stack:**

- Backend: .NET 10.0 Minimal APIs, EF Core 10.0.3, PostgreSQL 17.6
- Frontend: Next.js 16.1.6, React 19.2.3, TypeScript 5, Tailwind CSS 4
- Orchestration: .NET Aspire 13.1.2 (dev only, not Docker)
- Testing: xUnit (backend), Jest (frontend), Playwright (e2e)

**Current State:**

- 26 API endpoints (Coworkers: 6, Projects: 5, Tasks: 5, Assignments: 5, Calendar: 4, Status: 1)
- 112 passing tests (verified)
- 18 reusable UI components
- 5 utility modules (logger, config, date, types, api)
- Full CRUD operations on all entities
- Aspire-based observability (OpenTelemetry, structured logging)

---

## ⚠️ CRITICAL RULES (Enforce Always)

### 1. Documentation Update Protocol

**MANDATORY:** Update documentation IMMEDIATELY with ANY code change.

**Update Order:**

1. **AGENTS.md** (this file) - Source of truth for AI agents
2. **README.md** - If user-facing changes (features, setup, usage)
3. **CODE_DOCUMENTATION.md** - If technical changes (architecture, patterns, APIs)
4. **Specialized docs** - As needed (DEPLOYMENT.md, TESTING.md, MONITORING.md)

**Why:** Documentation drift wastes time and causes confusion. Outdated docs are worse than no docs.

### 2. Logging Standards

- Backend: Use `ILogger<Program>` only (NEVER `Console.WriteLine`)
- Frontend: Use `logger.debug/info/warn/error` (NEVER `console.log`)
- Error boundaries catch React errors automatically
- Aspire provides OpenTelemetry tracing/metrics/logs

### 3. Status Values (Use Exact Strings)

**Task Statuses:** `"Planning"` | `"In Progress"` | `"On Hold"` | `"Completed"` | `"Continuous"` | `"Cancelled"`  
**Project Statuses:** `"Planning"` | `"In Progress"` | `"On Hold"` | `"Completed"` | `"Cancelled"`

**NEVER use:** "Not started", "In progress" (lowercase p), or any other variants

### 4. Validation Rules

- `Task.WeeklyEffort` > 0 (validated on POST/PUT)
- `Coworker.Capacity` > 0
- Soft delete for Coworkers (`IsActive` flag)
- Cascade delete: Projects → Tasks → Assignments

### 5. Security Requirements

- ✅ EF Core parameterized queries (automatic SQL injection prevention)
- ✅ React auto-escaping (automatic XSS prevention)
- ✅ CORS: localhost:3000/3001 (dev), configure domain (prod)
- ✅ Secrets: `.env` files (git-ignored) or Azure Key Vault (prod)
- ❌ NEVER commit `.env` files or log passwords/tokens/PII
- ❌ NEVER use `dangerouslySetInnerHTML` or `AllowAnyOrigin()`

---

## 📐 CODING STANDARDS

### Design Principles (Apply Always)

**YAGNI** - Don't add features until needed. Remove unused code/imports.  
**DRY** - Extract repeated logic (2+ occurrences) into reusable functions/components.  
**SOLID** - Single responsibility, composition over modification, small focused interfaces.  
**CRUD** - All entities support Create, Read, Update, Delete (RESTful conventions).  
**ACID** - EF Core handles database transactions automatically.

### Component Creation Rules (Frontend)

**Create reusable component when:**

- Pattern appears 2+ times across different pages
- Component is self-contained with clear props
- Component reduces parent complexity

**Existing reusable components (18 total):**
ActionButtons, Button, CreateAssignmentModal, CreateTaskModal, ErrorBoundary, Footer, FormInputs, LoadingSpinner, Modal, Navbar, PageLayout, ProgressBar, RoleSwitcher, Table, Toast, UserSettings, WeeklyCapacityView, WeekSelector

**Existing utilities (5 total):**

- `logger.ts` - Structured logging with log levels
- `config.ts` - Type-safe environment variable access
- `date.ts` - ISO week calculations, date formatting
- `types.ts` - Shared TypeScript interfaces (single source of truth)
- `api.ts` - API wrappers with automatic error logging

### Code Quality Checklist

**Before committing:**

- [ ] `dotnet build` succeeds (backend)
- [ ] `npm run build` succeeds (frontend + TypeScript check)
- [ ] `dotnet test` passes (112 tests must pass)
- [ ] No `console.log` (use `logger.debug`)
- [ ] No commented-out code
- [ ] Documentation updated (AGENTS.md, README.md, CODE_DOCUMENTATION.md)
- [ ] Status values use exact strings ("Planning", "In Progress", etc.)
- [ ] New tests added for new features

---

## 🏗️ ARCHITECTURE OVERVIEW

### Backend Structure

```text
backend/
├── Program.cs              # All API endpoints (26 total), DI config, middleware
├── Models/
│   └── CapSyncerDbContext.cs  # EF Core models (Coworker, Project, TaskItem, Assignment)
├── appsettings.json        # DB connection, log levels
└── Migrations/             # EF Core migrations (7 total)
```

**API Endpoints (26 total):**

- **Coworkers** (6): GET all, GET by id, POST, PUT, DELETE, PUT reactivate
- **Projects** (5): GET all, GET by id, POST, PUT, DELETE
- **Tasks** (5): GET all, GET by id, POST, PUT, DELETE
- **Assignments** (5): GET all, GET by id, POST, PUT, DELETE
- **Calendar** (4): GET weekly, GET weekly by coworker, GET current-week, GET week-from-date
- **Status** (1): GET status

### Frontend Structure

```text
frontend/
├── app/                    # Next.js App Router (8 pages)
│   ├── layout.tsx         # Root layout, ErrorBoundary, PermissionProvider, SEO
│   ├── page.tsx           # Dashboard (home page)
│   ├── dashboard/page.tsx # Same as home
│   ├── calendar/page.tsx  # Calendar view
│   ├── coworkers/[id]/    # Coworker detail
│   ├── projects/[id]/     # Project detail
│   ├── tasks/[id]/        # Task detail
│   └── assignments/[id]/  # Assignment detail
├── components/            # 18 reusable components
├── contexts/              # PermissionContext (role/name management)
└── utils/                 # 5 utility modules
```

### Data Models & Relationships

```text
Coworker (1) ──< Assignments >── (1) TaskItem
                                       │
                                       └─< (1) Project
```

**Coworker** - Team members with weekly capacity (soft delete via `IsActive`)  
**Project** - Projects with status and created date (cascades to Tasks)  
**TaskItem** - Tasks with priority, status, effort (cascades to Assignments)  
**Assignment** - Links coworkers to tasks with hours, year, weekNumber

---

## 🚀 DEVELOPMENT WORKFLOW

### Starting the Application

**⚠️ CRITICAL:** PostgreSQL must be started in Docker BEFORE running Aspire.

#### Recommended: Use Scripts

```powershell
# First run (one-time setup)
.\setup.ps1    # Installs dependencies, starts PostgreSQL

# Every subsequent run
.\start.ps1    # Checks PostgreSQL, starts Aspire
```

#### Manual Method

```powershell
# 1. Start PostgreSQL (REQUIRED FIRST)
docker-compose up -d postgres

# 2. Start Aspire AppHost
dotnet run --project CapSyncer.AppHost
```

**Aspire manages:**

- ✅ Backend API (<http://localhost:5128>)
- ✅ Frontend (<http://localhost:3000>)
- ✅ Aspire Dashboard (auto-opens in browser)
- ✅ Database creation and migrations
- ✅ Health checks and logging

**Important:** Docker is ONLY for PostgreSQL in dev. Backend/frontend run natively. Full Docker deployment is production-only (see DEPLOYMENT.md).

### Running Tests

```powershell
# Backend tests (112 total)
cd CapSyncer.Server.Tests
dotnet test --nologo

# With coverage
dotnet test --collect:"XPlat Code Coverage"

# Frontend tests
cd frontend
npm test               # Run once
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage

# E2E tests (Playwright)
cd e2e
npm run test:e2e
```

### Building

```powershell
# Backend
cd backend
dotnet build --nologo

# Frontend
cd frontend
npm run build  # Includes TypeScript type checking
```

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

- `DevCors`: <http://localhost:3000>, <http://localhost:3001>
- `ProdCors`: <https://your-production-domain.com> (update for actual domain)

### Frontend Configuration

**Environment Variables:**

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: <http://localhost:5128>)
- `NEXT_PUBLIC_BASE_URL` - Frontend base URL for SEO

---

## 🧪 Testing

### Test Structure

```text
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

**Current Test Status:** 112/112 tests passing (100%)

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

1. **Test Database**: Each test run uses unique InMemory database (prevents interference).

2. **CORS in Production**: Remember to update ProdCors policy with actual production domain in `backend/Program.cs`.

---

## � Logging & Monitoring

### Backend Logging

**✅ FULLY IMPLEMENTED** - All 26 API endpoints use structured logging

**Logging Standards:**

- Use **ILogger&lt;Program&gt;** (never Console.WriteLine)
- **LogInformation** - Successful operations
- **LogWarning** - Not found, validation failures
- **LogError** - Exceptions with context
- **LogDebug** - Low-priority info
- Structured logging with named parameters

**OpenTelemetry via Aspire:**

- HTTP requests, database queries, traces, runtime metrics
- Health checks: /health, /alive, /api/status
- Access Aspire Dashboard: `dotnet run --project CapSyncer.AppHost` (auto-opens browser)

**See MONITORING.md for detailed logging configuration and production setup.**

### Frontend Logging

**ErrorBoundary + Logger Utility:**

- `<ErrorBoundary>` catches React errors (in layout.tsx)
- `logger` utility (utils/logger.ts) for manual logging
- Use `logger.info/warn/error/debug` (never console.log)
- Ready for Sentry integration in production

**See MONITORING.md for frontend logging setup and production integration.**

---

## DOCUMENTATION FILES

**Core Documentation:**

- `AGENTS.md` - **This file** - AI agent reference (update FIRST)
- `README.md` - User guide and quick start (human-friendly)
- `CODE_DOCUMENTATION.md` - Architecture, patterns, code conventions
- `DEPLOYMENT.md` - Production deployment guide (Docker-based)
- `TESTING.md` - Complete testing guide
- `MONITORING.md` - Logging and monitoring guide

**API Reference:**

- `backend/CapSyncer.Server.http` - HTTP test file with all 26 endpoints

**Environment Templates:**

- `backend/.env.example` - Backend configuration template
- `frontend/.env.example` - Frontend configuration template

---

## 🔄 UPDATE INSTRUCTIONS FOR AI AGENTS

When working on this project:

1. **Follow CRITICAL RULES** - Status values, logging standards, validation rules
2. **Apply CODING STANDARDS** - YAGNI, DRY, SOLID principles
3. **Use proper logging** - `logger.debug/info/warn/error` (NO `console.log`)
4. **Create reusable components** - If pattern appears 2+ times, extract
5. **⚠️ UPDATE DOCUMENTATION (MANDATORY)** - See "Documentation Update Protocol" above
   - Update AGENTS.md FIRST (source of truth)
   - Update README.md if user-facing changes
   - Update CODE_DOCUMENTATION.md if technical changes
   - Documentation is NEVER optional
6. **Run tests** - Verify with `dotnet test` (should be 112/112 passing)
7. **Verify builds** - Both `dotnet build` and `npm run build` must succeed

---

## 📞 QUICK REFERENCE

**Default Ports:**

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
