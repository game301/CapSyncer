#!/bin/bash
# CapSyncer - Start Application Script
# Run this script to start the application after initial setup

echo "================================================"
echo "  CapSyncer - Starting Application"
echo "================================================"
echo ""

# Check if Docker is running
echo "Checking Docker..."
if docker ps > /dev/null 2>&1; then
    echo "✓ Docker is running"
else
    echo "✗ Docker is not running. Please start Docker first."
    exit 1
fi

echo ""

# Check if PostgreSQL container is running
echo "Checking PostgreSQL..."
if docker ps --filter "name=capsyncer-postgres" --format "{{.Names}}" | grep -q "capsyncer-postgres"; then
    echo "✓ PostgreSQL is running"
else
    echo "⚠ PostgreSQL not running. Starting it now..."
    if docker-compose up -d postgres; then
        echo "✓ PostgreSQL started"
        echo "Waiting for PostgreSQL to be ready..."
        sleep 3
    else
        echo "✗ Failed to start PostgreSQL"
        exit 1
    fi
fi

echo ""
echo "Starting Aspire AppHost..."
echo "(This will start both backend and frontend)"
echo ""
echo "Once started, access:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:5128"
echo "  Dashboard: Will open automatically"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

# Start the application
dotnet run --project ./CapSyncer.AppHost/CapSyncer.AppHost.csproj
