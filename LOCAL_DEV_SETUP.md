# CapSyncer - Local Development Setup Guide

**Last Verified:** March 5, 2026  
**Status:** ✅ All systems working

This guide will get your team up and running in ~5 minutes.

---

## 📋 Prerequisites

Before you start, make sure you have these installed:

| Tool               | Version               | Download Link                                     |
| ------------------ | --------------------- | ------------------------------------------------- |
| **.NET SDK**       | 10.0.103+             | https://dotnet.microsoft.com/download/dotnet/10.0 |
| **Node.js**        | 20+ (v24.13.0 tested) | https://nodejs.org/                               |
| **Docker Desktop** | Latest                | https://www.docker.com/products/docker-desktop    |

### ✅ Quick Version Check

Run these commands to verify your setup:

```powershell
dotnet --version    # Should show 10.0.103 or higher
node --version      # Should show v20.x.x or higher
docker --version    # Should show any recent version
```

**Important:** You do **NOT** need to install the Aspire workload. The project uses Aspire 13.1.2 directly via NuGet packages.

---

## 🚀 First-Time Setup (5 minutes)

### Step 1: Clone the Repository

```powershell
git clone https://github.com/game301/CapSyncer.git
cd CapSyncer
```

### Step 2: Install Frontend Dependencies

```powershell
cd frontend
npm install
cd ..
```

### Step 3: Configure Environment Variables

The `.env.local` file should already exist in `frontend/` with these values:

```env
NEXT_PUBLIC_API_BASEURL=http://localhost:5128
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

If it doesn't exist, copy from `.env.example`:

```powershell
cd frontend
Copy-Item .env.example .env.local
cd ..
```

### Step 4: Build the Solution (First Time Only)

```powershell
dotnet build
```

You should see:

```
Build succeeded in ~8s
```

---

## ▶️ Running the Application

### Option 1: Manual Start (Recommended)

**You need to start PostgreSQL manually, then use Aspire to orchestrate backend/frontend:**

**Step 1 - Start PostgreSQL:**

```powershell
docker run -d --name capsyncer-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17.6
```

**Step 2 - Start Application with Aspire:**

```powershell
dotnet run --project CapSyncer.AppHost
```

This automatically:

- ✅ Starts backend API on `http://localhost:5128`
- ✅ Starts frontend on `http://localhost:3000`
- ✅ Opens Aspire Dashboard for monitoring (typically `http://localhost:15249`)
- ✅ Backend auto-creates database and runs migrations
- ✅ Provides live logs and health monitoring

**Your browser will automatically open to the Aspire Dashboard.**

**Access the application:**

- 🌐 **Frontend:** http://localhost:3000
- 🔧 **Backend API:** http://localhost:5128/api/coworkers (test endpoint)
- 📊 **Aspire Dashboard:** Check terminal output for URL (e.g., `http://localhost:15249`)

> **Note:** PostgreSQL is NOT managed by Aspire. You must start it manually with Docker as shown in Step 1.

### Option 2: Full Manual Start (Without Aspire)

**Terminal 1 - Start PostgreSQL:**

```powershell
docker run -d --name capsyncer-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17.6
```

**Terminal 2 - Start Backend:**

```powershell
cd backend
dotnet run
```

**Terminal 3 - Start Frontend:**

```powershell
cd frontend
npm run dev
```

---

## 🛠️ Common Commands

### Start Development

```powershell
# Step 1: Start PostgreSQL (always required)
docker run -d --name capsyncer-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17.6

# Step 2: Start with Aspire (recommended)
dotnet run --project CapSyncer.AppHost

# OR manually (3 separate terminals after Step 1)
# Terminal 2: cd backend; dotnet run
# Terminal 3: cd frontend; npm run dev
```

### Stop Development

```powershell
# Stop Aspire (if running)
# Press Ctrl+C in the terminal

# Stop and remove PostgreSQL container
docker stop capsyncer-postgres
docker rm capsyncer-postgres

# Optional: Remove database data
docker volume rm capsyncer-pgdata
```

### Run Tests

```powershell
# Backend tests (112 tests)
dotnet test

# Frontend tests
cd frontend
npm test
```

### Build for Production

```powershell
# Backend
dotnet build -c Release

# Frontend
cd frontend
npm run build
```

### Database Operations

```powershell
# View database contents via API
Invoke-WebRequest -Uri "http://localhost:5128/api/coworkers" -UseBasicParsing | Select-Object -ExpandProperty Content

# Connect to PostgreSQL directly
docker exec -it capsyncer-postgres psql -U postgres -d capsyncerdb

# List all tables
docker exec capsyncer-postgres psql -U postgres -d capsyncerdb -c "\dt"

# View container logs
docker logs capsyncer-postgres
```

---

## 🏗️ Project Architecture

```
CapSyncer/
├── backend/                      # .NET 10 Minimal API
│   ├── Models/                   # EF Core entities and DbContext
│   ├── Migrations/               # Database migrations
│   ├── Program.cs                # 27 API endpoints
│   └── appsettings.json          # Configuration
├── frontend/                     # Next.js 16 + React 19
│   ├── app/                      # App Router pages
│   │   ├── dashboard/            # Main dashboard
│   │   ├── coworkers/[id]/       # Detail pages
│   │   ├── projects/[id]/
│   │   ├── tasks/[id]/
│   │   └── assignments/[id]/
│   ├── components/               # Shared React components
│   └── .env.local                # Environment variables
├── CapSyncer.AppHost/            # Aspire orchestrator
└── CapSyncer.ServiceDefaults/    # Shared service config
```

---

## 🔍 Troubleshooting

### Problem: "docker: command not found"

**Solution:** Install Docker Desktop and make sure it's running.

### Problem: "Port 5432 already in use"

**Solution:** Stop the existing PostgreSQL container:

```powershell
# Find and stop any PostgreSQL container on port 5432
docker ps -a --filter "publish=5432"
docker stop capsyncer-postgres
docker rm capsyncer-postgres

# Or stop any postgres container
docker ps -q --filter "ancestor=postgres" | ForEach-Object { docker stop $_ }
```

### Problem: "ASPIRE_ALLOW_UNSECURED_TRANSPORT" warning

**Solution:** This is normal for local development and can be ignored.

### Problem: Frontend shows "Loading..." forever

**Solution 1:** Verify backend is running:

```powershell
Invoke-WebRequest -Uri "http://localhost:5128/api/status" -UseBasicParsing
```

**Solution 2:** Check browser console (F12) for error messages.

**Solution 3:** Verify `.env.local` has the correct API URL:

```env
NEXT_PUBLIC_API_BASEURL=http://localhost:5128
```

### Problem: Database migration errors

**Solution:** The backend auto-creates the database on startup. If it fails:

```powershell
# Connect to postgres master database
docker exec -it <CONTAINER_ID> psql -U postgres

# Drop and recreate
DROP DATABASE IF EXISTS capsyncerdb;
CREATE DATABASE capsyncerdb;
\q

# Restart backend to re-run migrations
cd backend
dotnet run
```

### Problem: "Execution policy" error on Windows

**Solution:**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📊 Default Ports

| Service          | Port  | URL                   |
| ---------------- | ----- | --------------------- |
| Frontend         | 3000  | http://localhost:3000 |
| Backend API      | 5128  | http://localhost:5128 |
| PostgreSQL       | 5432  | localhost:5432        |
| Aspire Dashboard | 17xxx | Auto-opens in browser |

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Backend API responds: http://localhost:5128/api/status
- [ ] Database health check: http://localhost:5128/health
- [ ] Backend returns data: http://localhost:5128/api/coworkers
- [ ] Frontend loads: http://localhost:3000
- [ ] Dashboard works: http://localhost:3000/dashboard
- [ ] Aspire Dashboard shows all services green

---

## 🧪 Testing

### Backend Tests (xUnit)

```powershell
dotnet test
```

**Expected:** 112/112 tests passing

### Frontend Tests (Jest)

```powershell
cd frontend
npm test
```

### Test with Coverage

```powershell
# Backend
dotnet test --collect:"XPlat Code Coverage"

# Frontend
cd frontend
npm run test:coverage
```

---

## 📚 Additional Documentation

- **[README.md](README.md)** - Project overview and features
- **[CODE_DOCUMENTATION.md](CODE_DOCUMENTATION.md)** - Architecture guide
- **[MONITORING.md](MONITORING.md)** - Monitoring and observability
- **[API_GUIDE_AND_CLEANUP.md](API_GUIDE_AND_CLEANUP.md)** - Complete API reference
- **[TESTING.md](TESTING.md)** - Testing strategy

---

## 🐛 Getting Help

If you run into issues:

1. Check this troubleshooting section first
2. Verify all prerequisites are installed with correct versions
3. Check the Aspire Dashboard for service health
4. Review browser console (F12) for frontend errors
5. Check backend terminal output for API errors
6. Ensure Docker Desktop is running

---

## 🎯 Quick Reference

### Start Everything

```powershell
dotnet run --project CapSyncer.AppHost
```

### Stop Everything

```
Ctrl+C in the terminal running Aspire
```

### View Data

- Frontend Dashboard: http://localhost:3000/dashboard
- API Browser: http://localhost:5128/api/coworkers

### Run Tests

```powershell
dotnet test              # Backend
cd frontend; npm test    # Frontend
```

---

**That's it!** Your team should be up and running in 5 minutes. 🚀
