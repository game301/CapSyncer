#!/usr/bin/env powershell
# Database Inspection Script for CapSyncer
# This script shows all data currently in your PostgreSQL database

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CAPSYNCERDB DATABASE CONTENTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Get the container ID
$containerId = (docker ps --filter "ancestor=postgres:17.6" -q)

if (-not $containerId) {
    Write-Host "❌ PostgreSQL container not found!" -ForegroundColor Red
    Write-Host "Make sure the application is running." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ Found PostgreSQL container: $containerId" -ForegroundColor Green
Write-Host ""

# Function to run SQL queries
function Query-Database {
    param([string]$query, [string]$title)
    
    Write-Host "╔══════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Yellow
    Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    $result = docker exec -it $containerId psql -U postgres -d capsyncerdb -c $query 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host $result
    } else {
        Write-Host "❌ Error executing query" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
    Write-Host ""
}

# Query all tables
Query-Database 'SELECT * FROM "Coworkers";' "COWORKERS TABLE"
Query-Database 'SELECT * FROM "Projects";' "PROJECTS TABLE"
Query-Database 'SELECT * FROM "Tasks";' "TASKS TABLE"
Query-Database 'SELECT * FROM "Assignments";' "ASSIGNMENTS TABLE"

# Show record counts
Write-Host "╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  RECORD COUNTS" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Query-Database 'SELECT COUNT(*) as "Total Coworkers" FROM "Coworkers";' ""
Query-Database 'SELECT COUNT(*) as "Total Projects" FROM "Projects";' ""
Query-Database 'SELECT COUNT(*) as "Total Tasks" FROM "Tasks";' ""
Query-Database 'SELECT COUNT(*) as "Total Assignments" FROM "Assignments";' ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   DATABASE INSPECTION COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To connect manually to the database:" -ForegroundColor Yellow
Write-Host "docker exec -it $containerId psql -U postgres -d capsyncerdb" -ForegroundColor White
Write-Host ""
Write-Host "Useful SQL commands once connected:" -ForegroundColor Yellow
Write-Host "  \dt                           - List all tables" -ForegroundColor White
Write-Host '  SELECT * FROM "Coworkers";    - View all coworkers' -ForegroundColor White
Write-Host "  \d ""Coworkers""                 - Show table schema" -ForegroundColor White
Write-Host "  \q                            - Quit" -ForegroundColor White
