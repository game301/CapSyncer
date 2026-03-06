# CapSyncer 🎯

> **Modern team capacity management system** - Track your team's workload, manage projects, and optimize resource allocation with real-time insights.

![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet) ![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17.6-336791?logo=postgresql) ![Tests](https://img.shields.io/badge/Tests-112%20passing-success)

---

## 📖 Table of Contents

- [What is CapSyncer?](#what-is-capsyncer)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## What is CapSyncer?

CapSyncer helps teams answer critical questions:

- 👥 **Who's available?** - See team capacity at a glance
- 📊 **Who's overloaded?** - Identify bottlenecks before they happen
- 📅 **What's due this week?** - Track assignments by week
- 🎯 **Where should I focus?** - Prioritize work based on team capacity

Built for **project managers**, **team leads**, and **individual contributors** who need visibility into team workload distribution.

---

## Key Features

### 🎛️ Dashboard Views

- **Team View** - See everyone's capacity and assignments
- **Personal View** - Focus on your own tasks and deadlines
- **Calendar View** - Weekly breakdown with ISO week numbers
- **Real-time Metrics** - Capacity utilization with visual progress bars

### 📋 Project Management

- **Projects** - Organize work into trackable projects with statuses
- **Tasks** - Break projects into tasks with priorities and effort estimates
- **Assignments** - Link team members to tasks with hour allocations
- **Coworkers** - Manage team profiles with weekly capacity limits

### 🔄 Smart Navigation

- Click through related entities (Project → Tasks → Assignments → Coworkers)
- Breadcrumb navigation for easy orientation
- Detail pages with full CRUD operations
- Search and filter capabilities

### 🎨 Modern UI

- Clean, responsive design built with **Tailwind CSS**
- Custom component library (no external UI framework)
- Color-coded statuses and priorities
- Mobile-friendly interface

---

## Quick Start

### Prerequisites

Make sure you have these installed:

- ✅ [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) - Backend runtime
- ✅ [Node.js 20+](https://nodejs.org/) - Frontend runtime
- ✅ [Docker Desktop](https://www.docker.com/products/docker-desktop) - For PostgreSQL database

### Option 1: One-Command Setup (Recommended)

**First time setup:**

```powershell
# Windows
.\setup.ps1

# Linux/Mac
chmod +x setup.sh && ./setup.sh
```

This installs dependencies and starts PostgreSQL.

**Start the application:**

```powershell
# Windows
.\start.ps1

# Linux/Mac
./start.sh
```

This starts everything and opens your browser automatically.

**Done!** 🎉 The app is running at:

- **Frontend**: <http://localhost:3000>
- **Backend API**: <http://localhost:5128>
- **Aspire Dashboard**: Opens automatically (monitoring & logs)

### Option 2: Manual Setup

<!-- markdownlint-disable MD033 -->
<details>
<summary>Click to expand manual setup instructions</summary>
<!-- markdownlint-enable MD033 -->

**1. Install .NET Aspire workload** (one-time):

```powershell
dotnet workload install aspire
```

**2. Start PostgreSQL:**

```powershell
docker-compose up -d postgres
```

**3. Install frontend dependencies:**

```powershell
cd frontend
npm install
cd ..
```

**4. Start the application:**

```powershell
dotnet run --project CapSyncer.AppHost
```

Aspire automatically:

- ✅ Creates the database
- ✅ Runs migrations
- ✅ Starts the backend
- ✅ Starts the frontend
- ✅ Opens the monitoring dashboard

<!-- markdownlint-disable MD033 -->
</details>
<!-- markdownlint-enable MD033 -->

### What's Running?

| Service              | URL                     | Description           |
| -------------------- | ----------------------- | --------------------- |
| **Frontend**         | <http://localhost:3000> | Main application UI   |
| **Backend API**      | <http://localhost:5128> | REST API endpoints    |
| **Aspire Dashboard** | Auto-opens (browser)    | Logs, traces, metrics |
| **PostgreSQL**       | `localhost:5432`        | Database (Docker)     |

---

## Technology Stack

### Backend

| Technology                    | Version | Purpose                       |
| ----------------------------- | ------- | ----------------------------- |
| **.NET**                      | 10.0    | Modern web runtime            |
| **ASP.NET Core Minimal APIs** | 10.0    | Lightweight REST API          |
| **Entity Framework Core**     | 10.0.3  | ORM for database              |
| **PostgreSQL**                | 17.6    | Production database           |
| **.NET Aspire**               | 13.1.2  | Orchestration & observability |
| **xUnit**                     | Latest  | Unit & integration testing    |

### Frontend

| Technology       | Version | Purpose                      |
| ---------------- | ------- | ---------------------------- |
| **Next.js**      | 16.1.6  | React framework (App Router) |
| **React**        | 19.2.3  | UI library                   |
| **TypeScript**   | 5.x     | Type-safe JavaScript         |
| **Tailwind CSS** | 4.x     | Utility-first CSS            |
| **Jest**         | Latest  | Component testing            |
| **Playwright**   | Latest  | E2E testing                  |

### Why These Technologies?

- **Modern & Future-Proof** - Latest stable versions with long-term support
- **Performance** - Minimal APIs and React 19 for maximum speed
- **Developer Experience** - Hot reload, strong typing, excellent tooling
- **Observability** - Aspire provides built-in monitoring and logging
- **No UI Framework Lock-in** - Custom components, full control

---

## Project Structure

```text
CapSyncer/
├── backend/                      # .NET Backend API
│   ├── Program.cs               # 26 API endpoints
│   ├── Models/                  # EF Core data models
│   └── Migrations/              # Database migrations
├── frontend/                     # Next.js Frontend
│   ├── app/                     # Pages & routes
│   ├── components/              # 18 reusable components
│   ├── contexts/                # React contexts
│   └── utils/                   # 5 utility modules
├── CapSyncer.AppHost/           # Aspire orchestration
├── CapSyncer.Server.Tests/     # 112 backend tests
│   ├── Unit/                    # Unit tests
│   └── Integration/             # Integration tests
├── e2e/                         # Playwright E2E tests
├── docker-compose.yml           # PostgreSQL for dev
└── *.md                         # Documentation

```

### Data Models

The system tracks four main entities with relationships:

```text
Coworker ──< Assignment >── TaskItem >── Project
```

- **Coworker**: Team members with weekly capacity (hours)
- **Project**: High-level project management with status tracking
- **Task**: Individual work items with priorities and effort estimates
- **Assignment**: Links coworkers to tasks with specific hours per week

Database is automatically created and migrated on first run.

**Stop Database:**

```bash
docker-compose down        # Keep data
docker-compose down -v     # Remove all data
```

---

## Development

### Backend Development

```bash
# Add new migration
cd backend
dotnet ef migrations add MigrationName

# Apply migrations
dotnet ef database update

# Run tests
cd ../CapSyncer.Server.Tests
dotnet test
```

### Frontend Development

```bash
cd frontend

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Run component tests
npm test
```

### Testing

**Test Structure:**

- `CapSyncer.Server.Tests/` - Backend unit & integration tests (112 tests)
- `frontend/__tests__/` - Component tests (Jest + React Testing Library)
- `e2e/` - E2E tests (Playwright)

See [TESTING.md](TESTING.md) for complete testing guide.

---

## Documentation

### For Developers

- **[AGENTS.md](AGENTS.md)** - AI agent guide, coding standards, critical rules
- **[CODE_DOCUMENTATION.md](CODE_DOCUMENTATION.md)** - Architecture deep-dive, patterns, conventions
- **[TESTING.md](TESTING.md)** - Testing strategy, test structure, how to run tests
- **[MONITORING.md](MONITORING.md)** - Logging, observability, Aspire dashboard guide

### For DevOps

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide, Docker setup

### API Reference

- **[backend/CapSyncer.Server.http](backend/CapSyncer.Server.http)** - All 26 API endpoints with examples

---

## Common Tasks

### Database Management

```powershell
# Create new migration
cd backend
dotnet ef migrations add MigrationName

# Apply migrations
dotnet ef database update

# Reset database (WARNING: Deletes all data)
dotnet ef database drop --force
dotnet ef database update
```

### Access Database

Use any PostgreSQL client:

- **Host**: localhost:5432
- **Database**: capsyncerdb
- **Username**: postgres
- **Password**: postgres

**Recommended tools**: [pgAdmin](https://www.pgadmin.org/), [DBeaver](https://dbeaver.io/), [TablePlus](https://tableplus.com/)

---

## Troubleshooting

### "Cannot connect to database"

```powershell
# Check PostgreSQL status
docker ps | findstr postgres

# Restart PostgreSQL
docker-compose restart postgres

# Verify connection
docker exec -it capsyncer-postgres psql -U postgres -d capsyncerdb -c "SELECT 1;"
```

### "Port already in use"

```powershell
# Windows: Find process
netstat -ano | findstr :5128

# Kill process (replace PID)
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5128 | xargs kill -9
```

### "Tests failing"

```powershell
# Clean and rebuild
dotnet clean && dotnet build

# Run with verbose output
dotnet test -v detailed
```

### "Aspire Dashboard won't open"

Look for this line in terminal:

```text
Now listening on: http://localhost:17xxx
```

Open that URL manually.

---

## Contributing

### Code Standards

- Follow patterns in existing code
- Use TypeScript (no `any` types)
- Add tests for new features
- Update documentation with changes
- Use conventional commits

### Before Submitting PR

- [ ] Tests pass (`dotnet test`)
- [ ] Code builds without warnings
- [ ] Documentation updated
- [ ] No `console.log`/`Console.WriteLine`
- [ ] Follow status conventions

See [AGENTS.md](AGENTS.md) for detailed standards.

---

## Project Status

**Current State (March 2026):**

- ✅ 26 API endpoints with full CRUD
- ✅ 112 passing tests (unit + integration)
- ✅ 18 reusable UI components
- ✅ Aspire observability integration
- ✅ Complete documentation

**Planned Features:**

- 🚧 Authentication (Azure AD B2C)
- 🚧 Real-time updates (SignalR)
- 🚧 Export/reporting (PDF/Excel)

## License

MIT License - Free for personal and commercial use.

---

Built with ❤️ using .NET 10 and Next.js 16
