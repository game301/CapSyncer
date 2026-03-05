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
    Write-Host "OK Docker is running" -ForegroundColor Green
} catch {
    Write-Host "ERROR Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Start PostgreSQL with Docker Compose (only postgres service for local dev)
Write-Host "[2/4] Starting PostgreSQL database..." -ForegroundColor Yellow
docker-compose up -d postgres
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK PostgreSQL container started" -ForegroundColor Green
    Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    Write-Host "OK PostgreSQL is ready" -ForegroundColor Green
} else {
    Write-Host "ERROR Failed to start PostgreSQL" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install Aspire workload
Write-Host "[3/4] Checking .NET Aspire workload..." -ForegroundColor Yellow
$aspireInstalled = dotnet workload list | Select-String -Pattern "aspire" -Quiet
if ($aspireInstalled) {
    Write-Host "OK Aspire workload already installed" -ForegroundColor Green
} else {
    Write-Host "Installing Aspire workload..." -ForegroundColor Yellow
    dotnet workload install aspire
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK Aspire workload installed" -ForegroundColor Green
    } else {
        Write-Host "WARNING Failed to install Aspire workload. You may need to install it manually." -ForegroundColor Yellow
    }
}

Write-Host ""

# Install frontend dependencies
Write-Host "[4/4] Installing frontend dependencies..." -ForegroundColor Yellow
Push-Location frontend
npm install
$npmExitCode = $LASTEXITCODE
Pop-Location

if ($npmExitCode -eq 0) {
    Write-Host "OK Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "ERROR Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: .\start.ps1" -ForegroundColor White
Write-Host "  2. Open: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Database credentials (for pgAdmin):" -ForegroundColor Yellow
Write-Host "  Host:     localhost" -ForegroundColor White
Write-Host "  Port:     5432" -ForegroundColor White
Write-Host "  Database: capsyncerdb" -ForegroundColor White
Write-Host "  User:     postgres" -ForegroundColor White
Write-Host "  Password: postgres" -ForegroundColor White
Write-Host ""
