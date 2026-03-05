# CapSyncer

A modern team capacity management system built with .NET Aspire and Next.js.

**Last Updated:** March 5, 2026

## Overview

CapSyncer helps teams manage workload capacity by tracking team members, projects, tasks, and assignments. It provides a comprehensive dashboard to visualize and manage team resources efficiently.

## Tech Stack

### Backend

- **.NET 10** - Latest .NET runtime
- **ASP.NET Core Minimal APIs** - Lightweight REST API endpoints
- **Entity Framework Core 10.0.3** - ORM for database operations
- **.NET Aspire 13.1.2** - Cloud-native orchestration and service discovery
- **PostgreSQL 17.6** - Primary database

### Frontend

- **Next.js 16.1.6** - React framework with App Router
- **React 19.2.3** - Latest React for UI components
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Custom Components** - Purpose-built UI components

## Features

### Dashboard

- 📊 Team and Personal views
- 📈 Real-time capacity tracking
- 🎯 Visual workload distribution

### Entity Management

- 👥 **Coworkers** - Team member profiles with role and contact info
- 📁 **Projects** - Project tracking with timelines
- ✅ **Tasks** - Task management with priorities and status
- 📝 **Assignments** - Link team members to tasks with hour allocation

### Navigation

- 🔗 Click-through navigation between related entities
- 📄 Detailed views for each entity type
- 🧭 Breadcrumb navigation and back buttons

### UI Components & Utilities

**Reusable Components:**

- Table component with sorting and actions
- Modal dialogs for CRUD operations
- Form inputs (Input, Select, Textarea) with validation
- Button, LoadingSpinner, Toast notifications
- ProgressBar, ErrorBoundary
- Consistent layout with PageLayout, Navbar and Footer

**Utility Modules:**

- **logger.ts** - Structured logging (production-safe debug levels)
- **config.ts** - Environment variable access with type safety
- **date.ts** - ISO week calculations and date formatting
- **types.ts** - Shared TypeScript interfaces (single source of truth)
- **api.ts** - Standardized API wrappers with automatic logging

## Project Structure

```
CapSyncer/
├── backend/                    # ASP.NET Core backend
│   ├── Models/                # EF Core models and DbContext
│   ├── Migrations/            # Database migrations
│   └── Program.cs             # API endpoints and startup
├── frontend/                   # Next.js frontend
│   ├── app/                   # App Router pages
│   │   ├── dashboard/         # Main dashboard
│   │   ├── coworkers/[id]/   # Coworker detail pages
│   │   ├── projects/[id]/    # Project detail pages
│   │   ├── tasks/[id]/       # Task detail pages
│   │   └── assignments/[id]/ # Assignment detail pages
│   ├── components/            # Shared React components
│   ├── utils/                 # Utility modules (logger, api, types, config, date)
│   └── contexts/              # React contexts (PermissionContext)
├── CapSyncer.AppHost/         # .NET Aspire orchestrator
└── CapSyncer.ServiceDefaults/ # Shared service configuration
```

## Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (for PostgreSQL only)
- [.NET Aspire workload](https://learn.microsoft.com/en-us/dotnet/aspire/fundamentals/setup-tooling) (recommended)

### Quick Start with Aspire (Recommended)

**This is the primary development workflow.**

1. **Install Aspire workload** (one-time setup)

   ```powershell
   dotnet workload install aspire
   ```

2. **Run the application**
   ```powershell
   dotnet run --project CapSyncer.AppHost
   ```

That's it! Aspire will:

- ✅ Automatically start PostgreSQL in a container
- ✅ Start the backend API on http://localhost:5128
- ✅ Start the frontend on http://localhost:3000
- ✅ Open the Aspire Dashboard (browser opens automatically, typically http://localhost:17xxx)
- ✅ Auto-create the database and run migrations
- ✅ Provide real-time logs and health monitoring

> **Note:** Docker is only used for PostgreSQL. The backend and frontend run natively, not in containers.

### Alternative: Using Setup Scripts

If you have the setup scripts:

```powershell
# Windows
.\setup.ps1    # First time only
.\start.ps1    # Start the application

# Linux/Mac
chmod +x setup.sh start.sh
./setup.sh     # First time only
./start.sh     # Start the application
```

> **Note for Windows users:** If you get an execution policy error, run:
>
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

### Manual Setup (Without Aspire)

**Only use this if you cannot use Aspire.**

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd CapSyncer
   ```

````

2. **Start PostgreSQL with Docker Compose**

   ```bash
   docker-compose up -d
   ```

   This will:
   - Start PostgreSQL 17.6 in Docker on port 5432
   - Create `capsyncerdb` database automatically
   - Set up persistent volume for data storage
   - Configure health checks

3. **Install frontend dependencies (first time only)**

   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Start everything with Aspire**

   ```bash
   dotnet run --project CapSyncer.AppHost/CapSyncer.AppHost.csproj
   ```

   This single command will:
   - Auto-create the database if it doesn't exist
   - Run all EF Core migrations automatically
   - Start the backend API on http://localhost:5128
   - **Start the frontend on http://localhost:3000**
   - Open the Aspire Dashboard

   **Note:** After the first `npm install`, you don't need to run the frontend separately. AppHost manages both backend and frontend.

### Database Connection

To connect with **pgAdmin** or other database tools:

- **Host:** localhost
- **Port:** 5432
- **Database:** capsyncerdb
- **Username:** postgres
- **Password:** postgres

The database is automatically created and migrated on first run. All tables (Coworkers, Projects, Tasks, Assignments) are set up using EF Core migrations.

To stop the database:

```bash
docker-compose down
```

To stop and **remove all data**:

```bash
docker-compose down -v
```

### Database Management

**View database contents:**

```powershell
.\view-database.ps1
```

**Test API endpoints:**

```powershell
.\test-api.ps1
```

## API Endpoints

### Coworkers

- `GET /api/coworkers` - List all team members
- `GET /api/coworkers/{id}` - Get specific coworker
- `POST /api/coworkers` - Create new coworker
- `PUT /api/coworkers/{id}` - Update coworker
- `DELETE /api/coworkers/{id}` - Delete coworker

### Projects

- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get specific project
- `POST /api/projects` - Create new project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Tasks

- `GET /api/tasks` - List all tasks
- `GET /api/tasks/{id}` - Get specific task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

### Assignments

- `GET /api/assignments` - List all assignments
- `GET /api/assignments/{id}` - Get specific assignment
- `POST /api/assignments` - Create new assignment
- `PUT /api/assignments/{id}` - Update assignment
- `DELETE /api/assignments/{id}` - Delete assignment

## Development

### Backend Development

The backend uses Entity Framework Code-First migrations. To add a new migration:

```bash
cd backend
dotnet ef migrations add MigrationName
```

### Frontend Development

Components are organized in `/frontend/components` for better reusability. Pages use the Next.js 16 App Router pattern with dynamic routes for detail views.

### Testing

CapSyncer has a comprehensive test suite covering unit, integration, and E2E tests.

**Package Management:** Tests use **separate package.json files** for clean dependency management:

- `frontend/package.json` - Component tests (Jest + React Testing Library)
- `e2e/package.json` - E2E tests (Playwright - independent)
- `backend.tests/` - .NET xUnit tests (no Node.js packages)

**Run all tests:**

```powershell
# Windows
.\run-all-tests.ps1

# Linux/Mac
chmod +x run-all-tests.sh
./run-all-tests.sh
```

**Run specific test suites:**

```bash
# Backend unit tests
cd backend.tests
dotnet test --filter "FullyQualifiedName~Unit"

# Backend integration tests
dotnet test --filter "FullyQualifiedName~Integration"

# Frontend component tests
cd frontend
npm test

# E2E tests (requires app running)
cd e2e
npm install
npx playwright install
npm run test:e2e
```

See [TESTING.md](TESTING.md) for detailed testing documentation.

**Test Coverage:**

- ✅ Backend Unit Tests (Models, Business Logic)
- ✅ Backend Integration Tests (API Endpoints)
- ✅ Frontend Component Tests (React Components)
- ✅ Context Tests (React Context, Hooks)
- ✅ E2E Tests (Complete User Workflows)

## 📚 Documentation

Comprehensive documentation is available to help you understand and work with CapSyncer:

### Core Documentation

- **[AI_CONTEXT.md](AI_CONTEXT.md)** - AI agent memory and project context
  - Complete project overview and architecture
  - Business rules and conventions (status values, validation rules)
  - API endpoints reference (27 total endpoints)
  - Recent changes history
  - Development workflow and testing guide
  - **📌 START HERE for AI agents and new developers**

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
  - Docker deployment with docker-compose
  - Production environment setup
  - SSL/HTTPS configuration with Nginx
  - Database backups and maintenance
  - Monitoring and health checks
  - Troubleshooting common issues

### Additional Guides

- **[LOCAL_DEV_SETUP.md](LOCAL_DEV_SETUP.md)** - Local development setup guide
- **[TESTING.md](TESTING.md)** - Complete testing guide (unit, integration, E2E)
- **[MONITORING.md](MONITORING.md)** - Observability and monitoring guide
- **[CODE_DOCUMENTATION.md](CODE_DOCUMENTATION.md)** - Technical architecture and code guide

### Configuration Files

- **[backend/.env.example](backend/.env.example)** - Backend environment variables template
- **[frontend/.env.example](frontend/.env.example)** - Frontend environment variables template
- **[backend/CapSyncer.Server.http](backend/CapSyncer.Server.http)** - HTTP test file with all 27 endpoints

### Docker & Deployment

- **[docker-compose.yml](docker-compose.yml)** - Multi-service orchestration (PostgreSQL, Backend, Frontend)
- **[backend/Dockerfile](backend/Dockerfile)** - .NET API containerization
- **[frontend/Dockerfile](frontend/Dockerfile)** - Next.js frontend containerization
- **[backend/.dockerignore](backend/.dockerignore)** - Backend Docker ignore rules
- **[frontend/.dockerignore](frontend/.dockerignore)** - Frontend Docker ignore rules

## 🐳 Docker Deployment

**Important:** CapSyncer uses **.NET Aspire** for development. Docker containers are for **production deployment only**. The PostgreSQL database can run in Docker for both development and production.

### Development (Aspire - Recommended)

```powershell
# Install Aspire workload (one-time)
dotnet workload install aspire

# Run everything
dotnet run --project CapSyncer.AppHost
```

Aspire automatically manages:
- PostgreSQL container
- Backend API (http://localhost:5128)
- Frontend (http://localhost:3000)
- Aspire Dashboard (opens in browser automatically)

### Production (Docker)

```bash
# 1. Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2. Start all services (PostgreSQL + Backend + Frontend)
docker-compose up -d --build

# 3. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5128
# PostgreSQL: localhost:5432
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions including:
- Production configuration
- Nginx reverse proxy setup
- SSL certificates with Let's Encrypt
- Database backups
- Monitoring and troubleshooting

## Git Workflow

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `style:` - Code style changes
- `test:` - Test additions or changes
- `chore:` - Maintenance tasks

## License

MIT

## Author

Built with ❤️ using .NET Aspire and Next.js
````
