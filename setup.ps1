# CapSyncer - First Time Setup Script
# Run this script once when you first clone the repository

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CapSyncer - First Time Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "[1/3] Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Start PostgreSQL with Docker Compose
Write-Host "[2/3] Starting PostgreSQL database..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ PostgreSQL started successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to start PostgreSQL" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install frontend dependencies
Write-Host "[3/3] Installing frontend dependencies..." -ForegroundColor Yellow
Push-Location frontend
npm install
$npmExitCode = $LASTEXITCODE
Pop-Location

if ($npmExitCode -eq 0) {
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! 🎉" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: " -NoNewline
Write-Host ".\start.ps1" -ForegroundColor White
Write-Host "  2. Open: " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Database credentials (for pgAdmin):" -ForegroundColor Yellow
Write-Host "  Host:     localhost" -ForegroundColor White
Write-Host "  Port:     5432" -ForegroundColor White
Write-Host "  Database: capsyncerdb" -ForegroundColor White
Write-Host "  User:     postgres" -ForegroundColor White
Write-Host "  Password: postgres" -ForegroundColor White
Write-Host ""
