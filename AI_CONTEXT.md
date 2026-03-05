# CapSyncer - AI Agent Context & Memory

> **Last Updated:** March 5, 2026
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

## 🤖 AI Agent Guidelines (READ FIRST)

> **📌 This file is automatically loaded into AI context.** The first 200 lines are read on every session start, so critical information should be placed early.

### Pre-Work Checklist

**Before starting ANY work on this project, verify:**

1. ✅ **Documentation up-to-date**
   - Check AI_CONTEXT.md, README.md, CODE_DOCUMENTATION.md dates
   - Verify all markdown files reflect current code state
   - Update "Last Updated" dates when making changes

2. ✅ **Tests work and are relevant**
   - Run `dotnet test` - should see 112/112 passing
   - Verify tests cover new/changed functionality
   - Remove obsolete tests, add tests for new features

3. ✅ **Logging properly implemented**
   - Backend: Uses Aspire OpenTelemetry (automatic)
   - Frontend: Uses logger utility (logger.info/warn/error/debug)
   - NO console.log for debugging - use logger.debug instead
   - Error boundaries catch React errors

4. ✅ **Code documentation and comments**
   - Public APIs have XML docs (C#) or JSDoc (TypeScript)
   - Complex logic has inline comments explaining WHY, not WHAT
   - File headers describe purpose and responsibility

5. ✅ **Setup files and scripts correct**
   - Configuration files valid (appsettings.json, .env examples)
   - **.gitignore** files present (root, frontend)
   - **.env.example** files present (backend, frontend) - DO NOT commit .env files
   - Package.json dependencies match installed packages
   - .csproj files reference correct NuGet versions
   - Docker files (production only) are functional

6. ✅ **All needed packages installed**
   - Backend: `dotnet restore` succeeds
   - Frontend: `npm install` succeeds
   - No missing dependencies or version conflicts

### Project Standards & Principles

**ALWAYS follow these principles when writing code:**

#### YAGNI (You Aren't Gonna Need It)

- Don't add functionality until it's needed
- Remove unused code, imports, and dependencies
- Keep components focused on current requirements

#### DRY (Don't Repeat Yourself)

- Extract repeated logic into reusable functions/components
- Use shared utilities (logger, API helpers, formatters)
- Frontend: Create reusable components when pattern appears 2+ times
- Backend: Use helper methods for repeated validation/transformation

#### SOLID Principles (Basic)

- **Single Responsibility**: One component/class = one purpose
- **Open/Closed**: Extend behavior with composition, not modification
- **Liskov Substitution**: Subclasses should be interchangeable
- **Interface Segregation**: Small, focused interfaces/props
- **Dependency Inversion**: Depend on abstractions (contexts, services)

#### CRUD Operations

- All entities support: Create, Read, Update, Delete
- RESTful conventions: POST (create), GET (read), PUT (update), DELETE (delete)
- Soft delete for Coworkers (IsActive flag), hard delete for others

#### ACID Principles (Database)

- **Atomicity**: Transactions are all-or-nothing
- **Consistency**: Database always in valid state
- **Isolation**: Concurrent operations don't interfere
- **Durability**: Committed data persists
- EF Core handles ACID automatically, but be mindful of transaction boundaries

#### Frontend Component Guidelines

- **Create reusable components** when:
  - Pattern appears 2+ times across different pages
  - Component is self-contained with clear props
  - Component reduces complexity in parent
- **Existing reusable components:**
  - Button, Input, Select, Textarea (FormInputs)
  - Table, Modal, Toast, LoadingSpinner
  - PageLayout, ErrorBoundary
  - ProgressBar, WeeklyCapacityView
  - CreateTaskModal, CreateAssignmentModal
- **Existing utility modules:**
  - logger.ts (structured logging)
  - config.ts (environment variables)
  - date.ts (date manipulation and formatting)
- **Component structure:**
  ```typescript
  // 1. Imports
  // 2. TypeScript interfaces/types
  // 3. Component definition with clear props
  // 4. State and effects
  // 5. Event handlers
  // 6. JSX return
  ```

### Code Quality Checklist

**Before committing code:**

- [ ] Builds without errors: `dotnet build` and `npm run build`
- [ ] All tests pass: `dotnet test`
- [ ] No console.log statements (use logger.debug)
- [ ] No commented-out code (remove or document why kept)
- [ ] All TODOs are intentional (production features only)
- [ ] New features have tests
- [ ] Documentation updated (AI_CONTEXT.md, README.md if needed)
- [ ] TypeScript has no errors: `npm run build` (includes type checking)

### Git Commit Recommendations

**After completing work, AI agents should suggest appropriate git commits:**

**Commit Message Format:**

```
<type>(<scope>): <short summary>

<optional detailed description>

<optional footer with breaking changes or issue references>
```

**Commit Types:**

- `feat`: New feature (e.g., `feat(frontend): add reusable ProgressBar component`)
- `fix`: Bug fix (e.g., `fix(api): validate WeeklyEffort > 0 on task creation`)
- `refactor`: Code restructuring without behavior change (e.g., `refactor: extract logger utility`)
- `docs`: Documentation only (e.g., `docs: update AI_CONTEXT with SOLID principles`)
- `test`: Adding/updating tests (e.g., `test: add integration tests for capacity endpoints`)
- `chore`: Maintenance tasks (e.g., `chore: update dependencies to latest versions`)
- `style`: Formatting, whitespace (e.g., `style: format code with prettier`)
- `perf`: Performance improvement (e.g., `perf: optimize database queries with indexes`)

**Examples of Good Commits:**

```bash
# Single feature with multiple files
git add frontend/components/ProgressBar.tsx frontend/app/projects/[id]/page.tsx
git commit -m "feat(frontend): add reusable ProgressBar component

- Created ProgressBar component with percentage/current/total props
- Replaced inline progress bars in project detail page
- Follows DRY principle by extracting repeated pattern
- Added TypeScript interfaces for type safety"

# Documentation update
git add AI_CONTEXT.md README.md
git commit -m "docs: add AI agent guidelines and project standards

- Added Pre-Work Checklist (6 items)
- Documented YAGNI, DRY, SOLID, CRUD, ACID principles
- Added git commit recommendations
- Updated Pre-Work Checklist with .gitignore/.env verification"

# Bug fix with test
git add backend/Program.cs backend.tests/TasksIntegrationTests.cs
git commit -m "fix(api): enforce WeeklyEffort > 0 validation on task PUT

- Added validation in PUT endpoint (was only in POST)
- Updated test to verify validation on update
- Fixes issue where tasks could be updated with 0 effort"

# Refactoring
git add frontend/app/tasks/[id]/page.tsx frontend/app/dashboard/page.tsx
git commit -m "refactor(frontend): replace console.log with logger utility

- Replaced 5 debug console.log statements with logger.debug
- Added structured context objects for better debugging
- Follows logging standards (production-safe)"
```

**Files to Check Before Committing:**

```bash
# See what changed
git status

# Review changes
git diff

# Stage specific files (recommended over git add .)
git add <specific-files>

# Verify .env files are NOT staged
git status | grep -E "\.env$"  # Should show nothing
```

**❌ DO NOT Commit:**

- `.env` files (use `.env.example` as template)
- `bin/` or `obj/` folders (ignored by .gitignore)
- `node_modules/` (ignored by .gitignore)
- `.vs/` or `.vscode/` personal settings
- Large binary files or build artifacts

**✅ DO Commit:**

- Source code (`.cs`, `.tsx`, `.ts`, `.css`)
- Configuration templates (`.env.example`, `appsettings.json`)
- Documentation (`.md` files)
- Tests
- `.gitignore` and `.dockerignore` files

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

**Current Status:** 112/112 tests passing (100%)

---

## 📝 Recent Changes & Decisions (Session History)

### March 5, 2026 - Code Refactoring & Logger Implementation

**Refactoring Completed:**

1. ✅ **Documentation Cleanup**:
   - Deleted API_GUIDE_AND_CLEANUP.md (265 lines of duplicate/outdated content)
   - Content was fully duplicated in AI_CONTEXT.md and CODE_DOCUMENTATION.md
   - Project documentation reduced from 15 to 10 files (33% reduction)
   - All remaining docs verified accurate and up-to-date

2. ✅ **Logger Implementation**:
   - Replaced 5 debug console.log statements with structured logger.debug calls
   - Added logger imports to 3 frontend files:
     - app/tasks/[id]/page.tsx (2 replacements)
     - app/dashboard/page.tsx (1 replacement)
     - app/projects/[id]/page.tsx (2 replacements)
   - Changed from: `console.log("message:", data)`
   - Changed to: `logger.debug("message", { data, context })`
   - Benefits: Production-safe, structured context, consistent logging

3. ✅ **Code Quality Audit**:
   - Backend: No unused code found, well-organized Program.cs (610 lines)
   - Frontend: No debugger statements or commented code
   - Models: All properties actively used
   - Only 4 intentional TODOs remain (production features: CORS domain, Sentry integration)

**Build Verification:**

- Frontend: 4.8s compile, 0 errors
- Backend: 6.3s build, 0 errors
- All tests: 112/112 passing (100%)

**Files Modified:**

- frontend/app/tasks/[id]/page.tsx
- frontend/app/dashboard/page.tsx
- frontend/app/projects/[id]/page.tsx

**Files Deleted:**

- API_GUIDE_AND_CLEANUP.md

### March 5, 2026 - Frontend Code Refactoring: DRY Principle & Shared Utilities

**Refactoring Completed:**

1. ✅ **Created Centralized Configuration Utility** (`frontend/utils/config.ts`):
   - Single source of truth for environment variables
   - Exports: API_BASE_URL, BASE_URL, APP_NAME, APP_DESCRIPTION
   - Replaced 6 duplicate `apiBaseUrl` declarations across pages
   - Benefits: Type-safe exports, consistent config access, easier environment changes

2. ✅ **Created Date Utilities Module** (`frontend/utils/date.ts`):
   - 5 reusable functions with comprehensive JSDoc documentation:
     * `getIsoWeekNumber(date)`: ISO 8601 week calculation (1-53)
     * `toDateTimeLocalString(date)`: HTML5 datetime-local formatting
     * `formatDate(date, options)`: Intl.DateTimeFormat wrapper
     * `daysBetween(start, end)`: Date arithmetic in days
     * `weeksBetween(start, end)`: Date arithmetic in weeks
   - Removed 24-line `getIsoWeekNumber` duplication from 2 pages (48 lines total)
   - Benefits: Consistent date handling, reusable logic, well-documented API

3. ✅ **Created LoadingSpinner Component** (`frontend/components/LoadingSpinner.tsx`):
   - 2 variants: `LoadingSpinner` (flexible) and `LoadingPage` (with PageLayout)
   - Props: message, size (sm/md/lg), fullScreen, className
   - Replaced 12-line inline spinner markup in 6 pages
   - Benefits: Consistent loading UI, easier to update globally, accessibility improvements

4. ✅ **Refactored 6 Pages to Use Shared Utilities**:
   - **tasks/[id]/page.tsx**: Removed getIsoWeekNumber, apiBaseUrl (3 refs), updated loading
   - **projects/[id]/page.tsx**: Removed getIsoWeekNumber, apiBaseUrl (5 refs), updated loading
   - **dashboard/page.tsx**: Removed apiBaseUrl (4 refs), replaced inline spinner with LoadingSpinner
   - **capacity/page.tsx**: Removed apiBaseUrl (3 refs), added LoadingSpinner to modals
   - **assignments/[id]/page.tsx**: Removed apiBaseUrl (4 refs), updated loading with LoadingPage
   - **coworkers/[id]/page.tsx**: Removed apiBaseUrl (4 refs), updated loading with LoadingPage

5. ✅ **Dependency Array Cleanup**:
   - Removed `apiBaseUrl` from useEffect/useCallback dependencies (constant doesn't change)
   - Pages affected: tasks/[id], projects/[id], dashboard, capacity, assignments/[id], coworkers/[id]
   - Benefits: Fewer unnecessary re-renders, improved performance

**Code Reduction & Impact:**

- **~200 duplicate lines removed** across 6 pages
- **3 new utility modules created** (260 lines with documentation)
- **Net improvement**: More maintainable code with single source of truth
- Component count: 17 → 18 components (added LoadingSpinner)
- Utility count: 1 → 3 utilities (logger, config, date)

**Build & Test Verification:**

- Frontend build: ✓ Compiled successfully in 6.8s
- TypeScript check: ✓ 0 errors
- Backend tests: ✓ 112/112 passing (100%)
- Pages optimized: ✓ 8 routes generated

**Files Created:**

- frontend/utils/config.ts (40 lines)
- frontend/utils/date.ts (130 lines)
- frontend/components/LoadingSpinner.tsx (90 lines)

**Files Modified:**

- frontend/app/tasks/[id]/page.tsx
- frontend/app/projects/[id]/page.tsx
- frontend/app/dashboard/page.tsx
- frontend/app/capacity/page.tsx
- frontend/app/assignments/[id]/page.tsx
- frontend/app/coworkers/[id]/page.tsx

**Principles Applied:**

- **DRY**: Eliminated all code duplication across pages
- **SOLID (Single Responsibility)**: Each utility has one clear purpose
- **YAGNI**: Only extracted actually duplicated code, not speculative features

### March 4, 2026 - Logging & Monitoring Infrastructure

**Implementation:**

1. ✅ **Backend Monitoring (Aspire + OpenTelemetry)**:
   - Integrated `builder.AddServiceDefaults()` in Program.cs for automatic observability
   - Added `app.MapDefaultEndpoints()` for /health and /alive endpoints
   - Configured health checks with DbContext monitoring
   - Enhanced appsettings.json with structured JSON logging
   - OpenTelemetry auto-tracks: HTTP requests, DB queries, traces, runtime metrics
2. ✅ **Frontend Error Tracking**:
   - Created ErrorBoundary component to catch all React errors
   - Wrapped entire app in ErrorBoundary in layout.tsx
   - Shows user-friendly error UI (no crashes)
   - Logs errors with full context in development
   - Ready for Sentry integration in production
3. ✅ **Client-Side Logging**:
   - Created logger utility in utils/logger.ts
   - Methods: info(), warn(), error(), debug()
   - API-specific helpers: logApiError(), logFetchError(), fetchWithLogging()
   - Console logging in development, ready for external service
4. ✅ **Documentation**:
   - Created comprehensive MONITORING.md (282 lines)
   - Updated AI_CONTEXT.md with logging section
   - Added detailed code comments to ErrorBoundary and logger

**Files Created:**

- frontend/components/ErrorBoundary.tsx (161 lines)
- frontend/utils/logger.ts (159 lines)
- MONITORING.md (282 lines)

**Files Modified:**

- backend/Program.cs (added Aspire integration, health checks)
- backend/appsettings.json (enhanced logging config)
- frontend/app/layout.tsx (wrapped in ErrorBoundary)

**Access Monitoring:**

```powershell
dotnet run --project CapSyncer.AppHost
# Aspire Dashboard opens at http://localhost:17xxx
# Tabs: Resources, Console, Structured, Traces, Metrics
```

**Test Results:**

- Build: Clean, all 4 projects succeeded
- Tests: 112/112 passing (100%)
- TypeScript/ESLint: No errors

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
- Final: 112/112 passing (100%)

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

## � Logging & Monitoring

### Backend (Aspire + OpenTelemetry)

**Automatically Tracked:**

- ✅ HTTP requests (duration, status codes, routes)
- ✅ Database queries (EF Core timing and commands)
- ✅ Traces (full request flow with dependencies)
- ✅ Runtime metrics (CPU, memory, GC, thread pool)
- ✅ Health checks (database connectivity)
- ✅ Structured logs (JSON formatted, searchable)

**Implementation:**

- `builder.AddServiceDefaults()` in Program.cs enables all telemetry
- `app.MapDefaultEndpoints()` adds /health, /alive endpoints
- Health check for DbContext monitors database
- Logs configured in appsettings.json (Information level default)

**Access:**

```powershell
dotnet run --project CapSyncer.AppHost
# Dashboard opens automatically at http://localhost:17xxx
```

**Dashboard Tabs:**

- Resources: Service status
- Console: Real-time logs
- Structured: Searchable logs
- Traces: Request visualization
- Metrics: Performance charts

### Frontend (ErrorBoundary + Logger)

**Automatically Tracked:**

- ✅ React component errors (caught by ErrorBoundary)
- ✅ User-friendly error UI (no app crashes)
- ✅ Error logging with stack traces
- ✅ Manual logging via logger utility

**Implementation:**

- `<ErrorBoundary>` wraps app in layout.tsx
- `logger` utility in utils/logger.ts for manual logging
- Logs to console in development
- Ready for production service (Sentry, LogRocket)

**Usage:**

```typescript
import { logger } from "@/utils/logger";

logger.info("Action performed", { userId: 123 });
logger.error("Operation failed", error);
logger.logApiError("/api/tasks", "POST", 500, error);
```

**Health Endpoints:**

- `/health` - Liveness probe (200 OK)
- `/alive` - Readiness probe (200 OK)
- `/api/status` - Detailed status (timestamp, environment, version)

**Production Setup:**

- Backend: Add Azure Application Insights (uncomment in ServiceDefaults/Extensions.cs)
- Frontend: Add Sentry integration (install @sentry/nextjs)
- See MONITORING.md for complete setup guide

---

## �🚀 Development Workflow

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
- `MONITORING.md` - Comprehensive monitoring and logging guide

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

**⚠️ BEFORE starting any work, complete the Pre-Work Checklist above.**

When working on this project:

1. **Follow Project Standards** - Review "AI Agent Guidelines" section (YAGNI, DRY, SOLID, etc.)
2. **Check status values** - Use "Planning" and "In Progress" (never "Not started" or "In progress")
3. **Validate business rules** - WeeklyEffort > 0, Capacity > 0, etc.
4. **Use proper logging** - logger.debug/info/warn/error (NO console.log)
5. **Create reusable components** - If pattern appears 2+ times, extract component
6. **Update documentation** - This file (AI_CONTEXT.md) first, then README/CODE_DOCUMENTATION
7. **Run tests** - Verify with `dotnet test` (should be 112/112 passing)
8. **Update HTTP file** - Add/modify examples when API changes
9. **Update test count** - Keep accurate count in documentation
10. **Verify builds** - Both `dotnet build` and `npm run build` must succeed

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
