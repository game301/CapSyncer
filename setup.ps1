# CapSyncer - First Time Setup Script
# Run this script once when you first clone the repository

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CapSyncer - First Time Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .NET SDK is installed
Write-Host "[1/8] Checking .NET SDK..." -ForegroundColor Yellow
try {
    $dotnetVersion = dotnet --version 2>$null
    if ($dotnetVersion -match "^10\." -or $dotnetVersion -match "^9\." -or [int]($dotnetVersion.Split('.')[0]) -ge 10) {
        Write-Host "OK .NET SDK $dotnetVersion found" -ForegroundColor Green
    } else {
        Write-Host "ERROR .NET SDK 10.x required, found $dotnetVersion" -ForegroundColor Red
        Write-Host "Download from: https://dotnet.microsoft.com/download/dotnet/10.0" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "ERROR .NET SDK not found" -ForegroundColor Red
    Write-Host "Download from: https://dotnet.microsoft.com/download/dotnet/10.0" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if Node.js is installed
Write-Host "[2/8] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    Write-Host "OK Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "ERROR Node.js not found" -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if Docker is running
Write-Host "[3/8] Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "OK Docker is running" -ForegroundColor Green
} catch {
    Write-Host "ERROR Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Start PostgreSQL with Docker Compose (only postgres service for local dev)
Write-Host "[4/8] Starting PostgreSQL database..." -ForegroundColor Yellow
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
Write-Host "[5/8] Checking .NET Aspire workload..." -ForegroundColor Yellow
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

# Restore backend dependencies
Write-Host "[6/8] Restoring backend dependencies..." -ForegroundColor Yellow
dotnet restore
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK Backend dependencies restored" -ForegroundColor Green
} else {
    Write-Host "ERROR Failed to restore backend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install frontend dependencies
Write-Host "[7/8] Installing frontend dependencies..." -ForegroundColor Yellow
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

# Install E2E test dependencies
Write-Host "[8/8] Installing E2E test dependencies..." -ForegroundColor Yellow
Push-Location e2e
npm install
$e2eExitCode = $LASTEXITCODE
Pop-Location

if ($e2eExitCode -eq 0) {
    Write-Host "OK E2E test dependencies installed" -ForegroundColor Green
} else {
    Write-Host "WARNING Failed to install E2E test dependencies (optional)" -ForegroundColor Yellow
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
