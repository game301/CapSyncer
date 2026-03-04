# CapSyncer Deployment Guide

> Comprehensive guide for deploying CapSyncer in various environments

**Important:** This project uses **.NET Aspire** for development orchestration. The Docker setup described here is for **production deployment only**. For local development, use Aspire (see Development Setup section).

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software

- **Docker** 24.0+ and Docker Compose 2.0+
- **.NET SDK** 10.0 (for local development)
- **Node.js** 20.0+ (for local development)
- **PostgreSQL** 17.6+ (if not using Docker)

### Optional Tools

- **Visual Studio 2022** or **VS Code** with C# extensions
- **.NET Aspire Workload** (for orchestrated development)
- **pgAdmin** or **DBeaver** (for database management)

---

## 🚀 Development Setup

### Prerequisites

- **.NET SDK 10.0**
- **Node.js 20+**
- **Docker** (for PostgreSQL only)
- **.NET Aspire Workload** (recommended)

### Option 1: Aspire Orchestration (Recommended)

**This is the primary development workflow for CapSyncer.**

```powershell
# Install Aspire workload (one-time setup)
dotnet workload install aspire

# Run the entire application stack
dotnet run --project CapSyncer.AppHost
```

Aspire will:

- ✅ Start PostgreSQL container automatically
- ✅ Start backend API on http://localhost:5128
- ✅ Start frontend on http://localhost:3000
- ✅ Open Aspire Dashboard (browser opens automatically)
- ✅ Handle service discovery and health checks

**Aspire Dashboard provides:**

- Real-time logs from all services
- Resource metrics and health status
- Distributed tracing
- Environment variables overview

### Option 2: Manual Development Setup

**Only use this if you can't use Aspire.**

**1. Start PostgreSQL:**

```powershell
# Using docker-compose (recommended)
docker-compose up -d postgres

# Or using individual docker command
docker run -d --name capsyncer-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=capsyncerdb \
  -p 5432:5432 \
  postgres:17.6
```

**2. Start Backend:**

```powershell
cd backend
dotnet run
```

Backend API: http://localhost:5128

**3. Start Frontend:**

```powershell
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000

### Running Tests

```powershell
cd backend
dotnet test --nologo

# With coverage
dotnet test --collect:"XPlat Code Coverage"
```

---

## 🐳 Docker Deployment

**Note:** Docker containerization is intended for **production deployment only**. For development, use .NET Aspire orchestration (see above).

### When to Use Docker

✅ **Production deployment** on servers or cloud platforms  
✅ **Staging environments** for testing  
✅ **CI/CD pipelines** for automated deployments  
❌ **NOT for local development** (use Aspire instead)

### Quick Start with Docker Compose

**1. Create environment files:**

```bash
# Backend .env
cp backend/.env.example backend/.env

# Frontend .env.local
cp frontend/.env.example frontend/.env.local
```

**2. Edit environment files with production values**

**3. Build and start all services:**

```powershell
docker-compose up -d --build
```

**Services:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5128
- PostgreSQL: localhost:5432

**4. Check service health:**

```powershell
docker-compose ps
docker-compose logs -f backend
```

**5. Stop services:**

```powershell
docker-compose down

# To also remove volumes (CAUTION: Deletes database data)
docker-compose down -v
```

### Individual Container Builds

**Backend only:**

```powershell
docker build -f backend/Dockerfile -t capsyncer-backend .
docker run -p 5128:8080 \
  -e CONNECTIONSTRINGS__CAPSYNCERDB="Host=host.docker.internal;Port=5432;Database=capsyncerdb;Username=postgres;Password=postgres" \
  capsyncer-backend
```

**Frontend only:**

```powershell
cd frontend
docker build -t capsyncer-frontend .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:5128 \
  capsyncer-frontend
```

---

## 🌐 Production Deployment

**Important:** The Docker setup is designed for production. Development uses Aspire orchestration without containerizing the backend and frontend.

### Prerequisites

1. **Domain name** with DNS configured
2. **SSL certificates** (Let's Encrypt recommended)
3. **Server** or cloud platform (Azure, AWS, GCP, DigitalOcean, etc.)
4. **PostgreSQL database** (managed or self-hosted)

### Deployment Steps

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose
sudo apt install docker-compose-plugin
```

#### 2. Configure Production Environment

**backend/.env:**

```bash
CONNECTIONSTRINGS__CAPSYNCERDB=Host=your-db-host;Port=5432;Database=capsyncerdb;Username=produser;Password=STRONG_PASSWORD_HERE
CORS__ALLOWED_ORIGINS=https://your-domain.com
ASPNETCORE_ENVIRONMENT=Production
LOGGING__LOGLEVEL__DEFAULT=Warning
```

**frontend/.env.local:**

```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NODE_ENV=production
```

#### 3. Update docker-compose.yml for Production

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: capsyncer-backend
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - CONNECTIONSTRINGS__CAPSYNCERDB=${CONNECTIONSTRINGS__CAPSYNCERDB}
      - CORS__ALLOWED_ORIGINS=${CORS__ALLOWED_ORIGINS}
    restart: always
    networks:
      - capsyncer-network

  frontend:
    build:
      context: frontend
      dockerfile: Dockerfile
    container_name: capsyncer-frontend
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
    restart: always
    depends_on:
      - backend
    networks:
      - capsyncer-network

  # Use external PostgreSQL in production
  # Remove postgres service and point to managed database
```

#### 4. Setup Reverse Proxy (Nginx)

**Install Nginx:**

```bash
sudo apt install nginx
```

**Configure Nginx (`/etc/nginx/sites-available/capsyncer`):**

```nginx
# Frontend
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:5128;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable site:**

```bash
sudo ln -s /etc/nginx/sites-available/capsyncer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

#### 6. Deploy Application

```bash
# Clone repository
git clone https://github.com/your-username/CapSyncer.git
cd CapSyncer

# Create and configure environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit files with production values

# Build and start services
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

---

## 🔐 Environment Variables

### Backend Environment Variables

| Variable                         | Description                     | Default              | Required |
| -------------------------------- | ------------------------------- | -------------------- | -------- |
| `CONNECTIONSTRINGS__CAPSYNCERDB` | PostgreSQL connection string    | localhost connection | ✅       |
| `CORS__ALLOWED_ORIGINS`          | Comma-separated allowed origins | localhost:3000       | ✅       |
| `ASPNETCORE_ENVIRONMENT`         | Environment name                | Development          | ❌       |
| `LOGGING__LOGLEVEL__DEFAULT`     | Log level                       | Information          | ❌       |
| `ASPNETCORE_URLS`                | Listening URLs                  | http://+:8080        | ❌       |

### Frontend Environment Variables

| Variable                  | Description               | Default               | Required |
| ------------------------- | ------------------------- | --------------------- | -------- |
| `NEXT_PUBLIC_API_URL`     | Backend API URL           | http://localhost:5128 | ✅       |
| `NEXT_PUBLIC_BASE_URL`    | Frontend base URL for SEO | http://localhost:3000 | ✅       |
| `NODE_ENV`                | Node environment          | development           | ❌       |
| `NEXT_TELEMETRY_DISABLED` | Disable Next.js telemetry | 1                     | ❌       |

---

## 🗄️ Database Setup

### Local PostgreSQL (Docker)

```powershell
# Start PostgreSQL
docker-compose up -d postgres

# Connect to database
docker exec -it capsyncer-postgres psql -U postgres -d capsyncerdb

# View tables
\dt

# Exit
\q
```

### Backup and Restore

**Backup:**

```bash
docker exec capsyncer-postgres pg_dump -U postgres capsyncerdb > backup.sql
```

**Restore:**

```bash
docker exec -i capsyncer-postgres psql -U postgres -d capsyncerdb < backup.sql
```

### Migrations

The application automatically runs migrations on startup in development mode.

For production, run migrations manually:

```powershell
cd backend
dotnet ef database update

# Or create migration SQL script
dotnet ef migrations script -o migration.sql
```

---

## 📊 Monitoring & Health Checks

### Health Check Endpoints

**Backend Health:**

```bash
curl http://localhost:5128/health
# Response: 200 OK

curl http://localhost:5128/api/status
# Response: {"status":"ok","now":"2026-03-04T10:00:00Z"}
```

**Frontend Health:**

```bash
curl http://localhost:3000
# Response: 200 OK
```

### Docker Health Checks

```bash
# Check all service health
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Check resource usage
docker stats
```

### Application Monitoring

Consider adding:

- **Application Insights** (Azure)
- **Sentry** for error tracking
- **Prometheus + Grafana** for metrics
- **ELK Stack** for log aggregation

---

## 🔧 Troubleshooting

### Common Issues

#### Backend won't start - "Database connection failed"

```powershell
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string
echo $env:CONNECTIONSTRINGS__CAPSYNCERDB

# Test PostgreSQL connection
docker exec -it capsyncer-postgres psql -U postgres -d capsyncerdb
```

#### Frontend can't connect to backend - CORS errors

1. Check backend CORS configuration in `Program.cs`
2. Verify `CORS__ALLOWED_ORIGINS` includes frontend URL
3. Check browser console for exact error
4. Ensure backend is running: `curl http://localhost:5128/health`

#### Docker build fails - DLL locked by process

```powershell
# Kill all .NET processes
Get-Process dotnet | Stop-Process -Force

# Clean and rebuild
dotnet clean
docker-compose down
docker-compose up -d --build
```

#### Database migrations fail

```powershell
# Reset database (CAUTION: Deletes all data)
docker-compose down -v
docker-compose up -d postgres

# Run application (will create database automatically in dev mode)
cd backend
dotnet run
```

#### High memory usage

```bash
# Check container resource usage
docker stats

# Restart services
docker-compose restart

# Limit container resources in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 512M
```

### Getting Help

- **Issues**: https://github.com/game301/CapSyncer/issues
- **Documentation**: Check `AI_CONTEXT.md` for detailed project information
- **Logs**: Always check `docker-compose logs` for detailed error messages

---

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

### Database Backups

Set up automated backups:

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec capsyncer-postgres pg_dump -U postgres capsyncerdb > backup_$DATE.sql
# Keep only last 7 days
find . -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /path/to/backup.sh
```

---

## 📝 Additional Resources

- [API Documentation](API_GUIDE_AND_CLEANUP.md)
- [Testing Guide](TESTING.md)
- [Database Guide](HOW_TO_VIEW_DATABASE.md)
- [AI Context](AI_CONTEXT.md)
- [Project Status](PROJECT_STATUS.md)

---

**Last Updated:** March 4, 2026
**Version:** 1.0.0
