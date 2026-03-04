# CapSyncer File Guide

> Quick reference for what each file does and whether you need it

**Last Updated:** March 4, 2026

---

## 🎯 Quick Answers

**Q: Do I need .env.example files?**  
✅ **YES** - They're public templates that should be committed to git. The actual `.env` files (with secrets) are gitignored.

**Q: Do I need the Dockerfiles?**  
🤷 **OPTIONAL** - Keep them if you might containerize for production. Delete if you're certain you won't. They don't hurt anything.

**Q: Can I delete some MD files?**  
✅ **YES** - See "Optional Documentation" below. Keep README.md and AI_CONTEXT.md at minimum.

---

## 📁 File Categories

### ⚙️ Essential Configuration

- `CapSyncer.slnx` - Solution file
- `backend/appsettings.json` - Backend config
- `backend/Program.cs` - API endpoints
- `frontend/package.json` - Dependencies
- `frontend/next.config.ts` - Next.js config
- `frontend/tsconfig.json` - TypeScript config
- `frontend/tailwind.config.ts` - Tailwind config
- `.gitignore` - Git exclusions

### 📚 Core Documentation (Keep These)

- `README.md` - Project overview & quick start
- `AI_CONTEXT.md` - Source of truth for AI agents (update FIRST)

### 📖 Extended Documentation (Useful)

- `CODE_DOCUMENTATION.md` - Architecture & patterns
- `DEPLOYMENT.md` - Production deployment
- `TESTING.md` - Testing guide
- `API_GUIDE_AND_CLEANUP.md` - API documentation

### 📝 Optional Documentation (Can Delete)

- `PROJECT_STATUS.md` - Progress tracking
- `SETUP_STATUS.md` - Setup checklist
- `FULL_TEST_REPORT.md` - Test results snapshot
- `HOW_TO_VIEW_DATABASE.md` - Database setup guide
- `FILE_GUIDE.md` - This file

### 🐳 Docker Files (Optional - For Production)

- `docker-compose.yml` - Multi-service orchestration (keep postgres part)
- `backend/Dockerfile` - Backend container
- `frontend/Dockerfile` - Frontend container
- `backend/.dockerignore` - Backend exclusions
- `frontend/.dockerignore` - Frontend exclusions
- `.dockerignore` - Root exclusions

**Note:** Only `docker-compose.yml` is used in development (for PostgreSQL). Other Docker files are for production deployment only.

### 🔧 Scripts (Convenience)

- `setup.ps1` / `setup.sh` - First-time setup
- `start.ps1` / `start.sh` - Start application
- `run-all-tests.ps1` / `.sh` - Run tests
- `test-api.ps1` - Test API endpoints

### 🔐 Environment Files

- `backend/.env.example` - ✅ COMMIT (public template)
- `backend/.env` - ❌ GITIGNORED (private secrets)
- `frontend/.env.example` - ✅ COMMIT (public template)
- `frontend/.env.local` - ❌ GITIGNORED (private secrets)

---

## 🧹 Suggested Cleanup (If You Want Fewer Files)

### Safe to Delete

```powershell
# Optional documentation
rm PROJECT_STATUS.md
rm SETUP_STATUS.md
rm FULL_TEST_REPORT.md
rm HOW_TO_VIEW_DATABASE.md
rm FILE_GUIDE.md

# Optional scripts (if you just use 'dotnet run --project CapSyncer.AppHost')
rm setup.ps1, setup.sh
rm start.ps1, start.sh
rm run-all-tests.ps1, run-all-tests.sh
rm test-api.ps1

# Docker files (if you're CERTAIN you won't containerize for production)
rm backend/Dockerfile
rm backend/.dockerignore
rm frontend/Dockerfile
rm frontend/.dockerignore
rm .dockerignore
# Keep docker-compose.yml for PostgreSQL
```

### Must Keep

- Core config files
- README.md
- AI_CONTEXT.md
- .gitignore
- .env.example files
- docker-compose.yml (for PostgreSQL)

---

## 🚨 Common Issues

### File Locking Warnings

```
warning MSB3026: The file is locked by: ".NET Host (xxxxx)"
```

**Fix:**

```powershell
Get-Process dotnet -ErrorAction SilentlyContinue | Stop-Process -Force
dotnet clean
dotnet build
```

Or just restart VS Code.

---

## 📝 File Maintenance Rules

**When making changes:**

1. Update `AI_CONTEXT.md` FIRST
2. Update `README.md` if setup changes
3. Update `CODE_DOCUMENTATION.md` if architecture changes
4. Update `DEPLOYMENT.md` if deployment process changes
5. Keep version numbers current
6. Keep "Last Updated" dates current

---

**Remember:** Less is more! Keep only what you actually use.
