# CapSyncer - Start Application Script
# Run this script to start the application after initial setup

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CapSyncer - Starting Application" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if PostgreSQL container is running
Write-Host "Checking PostgreSQL..." -ForegroundColor Yellow
$postgresRunning = docker ps --filter "name=capsyncer-postgres" --format "{{.Names}}" 2>$null

if ($postgresRunning -eq "capsyncer-postgres") {
    Write-Host "✓ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "⚠ PostgreSQL not running. Starting it now..." -ForegroundColor Yellow
    docker-compose up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ PostgreSQL started" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to start PostgreSQL" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Starting Aspire AppHost..." -ForegroundColor Yellow
Write-Host "(This will start both backend and frontend)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Once started, access:" -ForegroundColor Yellow
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:   http://localhost:5128" -ForegroundColor White
Write-Host "  Dashboard: Will open automatically" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Yellow
Write-Host ""

# Start the application
dotnet run --project .\CapSyncer.AppHost\CapSyncer.AppHost.csproj
