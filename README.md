# CapSyncer

A modern team capacity management system built with .NET Aspire and Next.js.

## Overview

CapSyncer helps teams manage workload capacity by tracking team members, projects, tasks, and assignments. It provides a comprehensive dashboard to visualize and manage team resources efficiently.

## Tech Stack

### Backend

- **.NET 10** - Latest .NET runtime
- **ASP.NET Core Minimal APIs** - Lightweight REST API endpoints
- **Entity Framework Core** - ORM for database operations
- **.NET Aspire** - Cloud-native orchestration and service discovery
- **PostgreSQL 17.6** - Primary database

### Frontend

- **Next.js 16.1** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React 19** - Latest React for UI components

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

### UI Components

- Reusable Table component with sorting and actions
- Modal dialogs for CRUD operations
- Form inputs with validation
- Consistent layout with Navbar and Footer

## Project Structure

````
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
│   └── components/            # Shared React components
├── CapSyncer.AppHost/         # .NET Aspire orchestrator
└── CapSyncer.ServiceDefaults/ # Shared service configuration

## Getting Started

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 18+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (for PostgreSQL)

### Running the Application

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd CapSyncer
````

2. **Start the backend with Aspire**

   ```bash
   dotnet run --project CapSyncer.AppHost/CapSyncer.AppHost.csproj
   ```

   This will:
   - Start PostgreSQL in Docker
   - Run database migrations
   - Start the backend API on http://localhost:5128
   - Open the Aspire Dashboard

3. **Install frontend dependencies**

   ```bash
   cd frontend
   npm install
   ```

4. **Start the frontend development server**
   ```bash
   npm run dev
   ```
   Frontend will be available at http://localhost:3000

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
