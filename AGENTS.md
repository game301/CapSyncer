# AI AGENT GUIDE - CapSyncer Project

> **⚠️ READ THIS FIRST:** This is the source of truth for AI agents. If you receive a partial view, use `read_file` to load the complete content.

---

## 🚦 AGENT WORKFLOW (Follow This Order)

**Before ANY code changes:**

1. Read relevant sections of this file
2. Check existing components/utilities before creating new ones
3. Verify status values and validation rules
4. Plan documentation updates

**After making changes (MANDATORY):**

1. Update **AGENTS.md** first (keep metrics current)
2. Update **README.md** if user-facing
3. Update **CODE_DOCUMENTATION.md** if architectural
4. Run `dotnet build` and `dotnet test` (backend)
5. Run `npm run build` and `npm test` (frontend)
6. Commit with Conventional Commits format
7. Push when ready

---

## 🎯 PROJECT SNAPSHOT

| Category       | Details                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------ |
| **Domain**     | Team capacity management (coworkers, projects, tasks, assignments)                         |
| **Backend**    | .NET 10.0, EF Core 10.0.3, PostgreSQL 17.6, Minimal APIs                                   |
| **Frontend**   | Next.js 16.1.6, React 19.2.3, TypeScript 5, Tailwind 4                                     |
| **Dev Stack**  | .NET Aspire 13.1.2, Docker (PostgreSQL only)                                               |
| **Testing**    | 112 tests passing (xUnit, Jest, Playwright)                                                |
| **APIs**       | 26 endpoints (Coworkers: 6, Projects: 5, Tasks: 5, Assignments: 5, Calendar: 4, Status: 1) |
| **Components** | 18 reusable UI components, 5 utility modules                                               |
| **Ports**      | Backend: 5128, Frontend: 3000, PostgreSQL: 5432                                            |

---

## ⚠️ CRITICAL RULES (Non-Negotiable)

### Status Values (Use Exact Strings)

| Entity      | Valid Values                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------- |
| **Task**    | `"Planning"` \| `"In Progress"` \| `"On Hold"` \| `"Completed"` \| `"Continuous"` \| `"Cancelled"` |
| **Project** | `"Planning"` \| `"In Progress"` \| `"On Hold"` \| `"Completed"` \| `"Cancelled"`                   |

❌ **NEVER use:** "Not started", "In progress" (lowercase p), or any other variants

### Logging (No Exceptions)

| Context  | Use                            | Never Use           |
| -------- | ------------------------------ | ------------------- |
| Backend  | `ILogger<Program>`             | `Console.WriteLine` |
| Frontend | `logger.debug/info/warn/error` | `console.log`       |

**Frontend logging is enforced in all components and modals.**

### Validation Rules

| Rule                | Constraint                                 |
| ------------------- | ------------------------------------------ |
| `Task.WeeklyEffort` | Must be > 0 (validated on POST/PUT)        |
| `Coworker.Capacity` | Must be > 0                                |
| Coworker deletion   | Soft delete via `IsActive` flag            |
| Cascade behavior    | Projects → Tasks → Assignments (automatic) |

### Security (Built-In)

✅ **Automatic protections:**  
SQL injection (EF Core parameterized queries) · XSS (React auto-escaping) · CORS (localhost:3000/3001 dev)

❌ **Never commit:**  
`.env` files · Passwords · Tokens · PII

❌ **Never use:**  
`dangerouslySetInnerHTML` · `AllowAnyOrigin()`

---

## 📐 CODING STANDARDS

### Design Principles (Apply Always)

**YAGNI** - Don't add features until needed. Remove unused code/imports.  
**DRY** - Extract repeated logic (2+ occurrences) into reusable functions/components.  
**SOLID** - Single responsibility, composition over modification, small focused interfaces.  
**CRUD** - All entities support Create, Read, Update, Delete (RESTful conventions).  
**ACID** - EF Core handles database transactions automatically.

| Principle   | Application                                                                 |
| ----------- | --------------------------------------------------------------------------- |
| **YAGNI**   | Don't add features until needed. Remove unused code/imports.                |
| **DRY**     | Extract repeated logic (2+ occurrences) into reusable functions/components. |
| **SOLID**   | Single responsibility, composition over modification, small interfaces.     |
| **RESTful** | All entities support standard CRUD operations.                              |

### Reusable Assets (Check Before Creating)

**Components (18):** ActionButtons · Button · CreateAssignmentModal · CreateTaskModal · ErrorBoundary · Footer · FormInputs · LoadingSpinner · Modal · Navbar · PageLayout · ProgressBar · RoleSwitcher · Table · Toast · UserSettings · WeeklyCapacityView · WeekSelector

**Utilities (5):** `logger.ts` (structured logging) · `config.ts` (env vars) · `date.ts` (ISO weeks) · `types.ts` (interfaces) · `api.ts` (API wrappers)

**Create new component when:** Pattern appears 2+ times, self-contained with clear props, reduces parent complexity.

### Pre-Commit Checklist

- [ ] Backend: `dotnet build` and `dotnet test` pass (112 tests)
- [ ] Frontend: `npm run build` and `npm test` pass
- [ ] No `console.log` or `Console.WriteLine`
- [ ] No commented-out code
- [ ] Documentation updated (AGENTS.md → README.md → CODE_DOCUMENTATION.md)
- [ ] Status values use exact strings

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

## 🚀 COMMON TASKS

### Start Development

**Prerequisites:** .NET 10 SDK, Node.js 20+, Docker Desktop

```powershell
# One-time setup
.\setup.ps1    # Windows
./setup.sh     # Linux/Mac

# Every subsequent run
.\start.ps1    # Windows (checks PostgreSQL, starts Aspire)
./start.sh     # Linux/Mac
```

**Manual (if scripts fail):**

```powershell
docker-compose up -d postgres
dotnet run --project CapSyncer.AppHost
```

**What Aspire manages:** Backend (5128) · Frontend (3000) · Dashboard · Database migrations · Health checks

⚠️ **PostgreSQL must start BEFORE Aspire.** Docker is dev-only for PostgreSQL. See DEPLOYMENT.md for production.

### Run Tests

| Command                                       | Purpose                                        |
| --------------------------------------------- | ---------------------------------------------- |
| `dotnet test`                                 | Backend tests (from `CapSyncer.Server.Tests/`) |
| `dotnet test --collect:"XPlat Code Coverage"` | With coverage                                  |
| `npm test`                                    | Frontend tests (from `frontend/`)              |
| `npm run test:watch`                          | Watch mode                                     |
| `npm run test:e2e`                            | E2E tests (from `e2e/`)                        |

### Build

```powershell
# Backend
cd backend; dotnet build --nologo

# Frontend (includes TypeScript check)
cd frontend; npm run build
```

### Commit Changes (Conventional Commits)

**Format:** `<type>(<scope>): <summary>` (max 72 chars, imperative mood)

**Types:** `feat` · `fix` · `docs` · `style` · `refactor` · `test` · `chore` · `perf` · `ci`  
**Scopes:** backend · frontend · setup · docs · tests · e2e

**Example:**

```bash
git commit -m "feat(backend): add cascade delete for projects to tasks

- Implement cascade delete in EF Core configuration
- Update integration tests to verify cascade behavior
- Add migration for foreign key constraints
- Update CODE_DOCUMENTATION.md with cascade rules"
```

**Commit when:**  
✅ Logical unit complete · Documentation updated · Tests pass  
❌ Broken code · Debug statements · Secrets

---

## ⚙️ CONFIGURATION

### Backend (appsettings.json)

| Setting           | Dev Value                                                                           | Notes                                 |
| ----------------- | ----------------------------------------------------------------------------------- | ------------------------------------- |
| Connection String | `Host=localhost;Port=5432;Database=capsyncerdb;Username=postgres;Password=postgres` | Use `.env` for secrets                |
| Environment       | `Testing` → InMemory DB · `Development`/`Production` → PostgreSQL                   | Unique DB per test run                |
| CORS              | DevCors: localhost:3000/3001                                                        | Update ProdCors for production domain |

### Frontend (.env)

| Variable               | Default                 | Purpose              |
| ---------------------- | ----------------------- | -------------------- |
| `NEXT_PUBLIC_API_URL`  | `http://localhost:5128` | Backend API endpoint |
| `NEXT_PUBLIC_BASE_URL` | -                       | SEO base URL         |

---

## 🧪 TESTING

**Current Status:** 112/112 passing (100%)

| Type        | Count | Location                              |
| ----------- | ----- | ------------------------------------- |
| Integration | 70+   | `CapSyncer.Server.Tests/Integration/` |
| Unit        | 42+   | `CapSyncer.Server.Tests/Unit/`        |
| Frontend    | -     | `frontend/__tests__/`                 |
| E2E         | -     | `e2e/tests/`                          |

**See TESTING.md for comprehensive testing guide.**

---

## 🎨 UI CONVENTIONS

### Status Badge Colors (Tailwind)

| Status      | Classes                                           |
| ----------- | ------------------------------------------------- |
| Planning    | `bg-blue-100 text-blue-800 border-blue-200`       |
| In Progress | `bg-green-100 text-green-800 border-green-200`    |
| On Hold     | `bg-yellow-100 text-yellow-800 border-yellow-200` |
| Completed   | `bg-purple-100 text-purple-800 border-purple-200` |
| Continuous  | `bg-cyan-100 text-cyan-800 border-cyan-200`       |
| Cancelled   | `bg-red-100 text-red-800 border-red-200`          |

### Priority Colors

| Priority  | Color  |
| --------- | ------ |
| Emergency | Red    |
| High      | Orange |
| Normal    | Blue   |
| Low       | Gray   |

---

## 🔍 LOGGING & MONITORING

**Status:** ✅ Fully implemented across all 26 API endpoints

| Layer         | Tool               | Log Levels                                                       | Access                          |
| ------------- | ------------------ | ---------------------------------------------------------------- | ------------------------------- |
| Backend       | `ILogger<Program>` | Info (success) · Warning (not found) · Error (exception) · Debug | Aspire Dashboard                |
| Frontend      | `logger` utility   | `info` · `warn` · `error` · `debug`                              | Browser console + ErrorBoundary |
| Observability | OpenTelemetry      | HTTP requests · DB queries · Traces · Metrics                    | Aspire Dashboard (auto-opens)   |
| Health Checks | Built-in           | `/health` · `/alive` · `/api/status`                             | Direct access                   |

**See MONITORING.md for detailed configuration and production setup (Sentry integration ready).**

---

## 📚 DOCUMENTATION MAP

| File                            | Purpose                        | Update When                                  |
| ------------------------------- | ------------------------------ | -------------------------------------------- |
| **AGENTS.md**                   | AI agent reference (this file) | ANY code change (update FIRST)               |
| **README.md**                   | User guide and quick start     | User-facing changes (features, setup, usage) |
| **CODE_DOCUMENTATION.md**       | Architecture and patterns      | Technical/architectural changes              |
| **DEPLOYMENT.md**               | Production deployment          | Infrastructure or Docker changes             |
| **TESTING.md**                  | Testing guide                  | Test strategy or tooling changes             |
| **MONITORING.md**               | Logging and observability      | Logging or monitoring changes                |
| `backend/CapSyncer.Server.http` | API endpoint samples           | New/modified endpoints                       |
| `backend/.env.example`          | Config template                | Backend environment variables                |
| `frontend/.env.example`         | Config template                | Frontend environment variables               |

---

## ⚠️ GOTCHAS

- **Test Database:** Each test uses unique InMemory DB (prevents interference, no cleanup needed)
- **CORS in Prod:** Update `ProdCors` policy in `backend/Program.cs` with actual domain
- **PostgreSQL First:** Must start PostgreSQL container BEFORE running Aspire
- **Docker Dev Only:** Docker is only for PostgreSQL in dev; see DEPLOYMENT.md for production
- **Status Casing:** "In Progress" (capital P) is correct, "In progress" will fail validation
- **Migration Order:** Aspire automatically applies migrations on startup
- **Button Type:** All Button components default to `type="button"` to prevent accidental form submissions
- **Loading States:** Data refresh operations (create/update/delete) skip loading spinner to prevent page flashes via optional `showLoading` parameter
- **Component Refresh:** WeeklyCapacityView uses `refreshTrigger` prop instead of key-based remounting to avoid loading spinners
- **Modal Defaults:** CreateTaskModal and CreateAssignmentModal default to empty selection (no auto-select for projects, coworkers, or tasks)
