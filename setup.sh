#!/bin/bash
# CapSyncer - First Time Setup Script
# Run this script once when you first clone the repository

echo "================================================"
echo "  CapSyncer - First Time Setup"
echo "================================================"
echo ""

# Check if .NET SDK is installed
echo "[1/8] Checking .NET SDK..."
if command -v dotnet > /dev/null 2>&1; then
    dotnetVersion=$(dotnet --version 2>/dev/null)
    if [[ $dotnetVersion =~ ^10\. ]] || [[ $dotnetVersion =~ ^9\. ]] || [[ ${dotnetVersion%%.*} -ge 10 ]]; then
        echo "✓ .NET SDK $dotnetVersion found"
    else
        echo "✗ .NET SDK 10.x required, found $dotnetVersion"
        echo "Download from: https://dotnet.microsoft.com/download/dotnet/10.0"
        exit 1
    fi
else
    echo "✗ .NET SDK not found"
    echo "Download from: https://dotnet.microsoft.com/download/dotnet/10.0"
    exit 1
fi

echo ""

# Check if Node.js is installed
echo "[2/8] Checking Node.js..."
if command -v node > /dev/null 2>&1; then
    nodeVersion=$(node --version 2>/dev/null)
    echo "✓ Node.js $nodeVersion found"
else
    echo "✗ Node.js not found"
    echo "Download from: https://nodejs.org/"
    exit 1
fi

echo ""

# Check if Docker is running
echo "[3/8] Checking Docker..."
if docker ps > /dev/null 2>&1; then
    echo "✓ Docker is running"
else
    echo "✗ Docker is not running. Please start Docker first."
    exit 1
fi

echo ""

# Start PostgreSQL with Docker Compose (only postgres service for local dev)
echo "[4/8] Starting PostgreSQL database..."
if docker-compose up -d postgres; then
    echo "✓ PostgreSQL container started"
    echo "Waiting for PostgreSQL to be ready..."
    sleep 3
    echo "✓ PostgreSQL is ready"
else
    echo "✗ Failed to start PostgreSQL"
    exit 1
fi

echo ""

# Check/Install Aspire workload
echo "[5/8] Checking .NET Aspire workload..."
if dotnet workload list | grep -q "aspire"; then
    echo "✓ Aspire workload already installed"
else
    echo "Installing Aspire workload..."
    if dotnet workload install aspire; then
        echo "✓ Aspire workload installed"
    else
        echo "⚠ Failed to install Aspire workload. You may need to install it manually."
    fi
fi

echo ""

# Restore backend dependencies
echo "[6/8] Restoring backend dependencies..."
if dotnet restore; then
    echo "✓ Backend dependencies restored"
else
    echo "✗ Failed to restore backend dependencies"
    exit 1
fi

echo ""

# Install frontend dependencies
echo "[7/8] Installing frontend dependencies..."
cd frontend && npm install
if [ $? -eq 0 ]; then
    echo "✓ Frontend dependencies installed"
    cd ..
else
    echo "✗ Failed to install frontend dependencies"
    exit 1
fi

echo ""

# Install E2E test dependencies
echo "[8/8] Installing E2E test dependencies..."
cd e2e && npm install
if [ $? -eq 0 ]; then
    echo "✓ E2E test dependencies installed"
    cd ..
else
    echo "⚠ Failed to install E2E test dependencies (optional)"
    cd ..
fi

echo ""
echo "================================================"
echo "  Setup Complete! 🎉"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Run: ./start.sh"
echo "  2. Open: http://localhost:3000"
echo ""
echo "Database credentials (for pgAdmin):"
echo "  Host:     localhost"
echo "  Port:     5432"
echo "  Database: capsyncerdb"
echo "  User:     postgres"
echo "  Password: postgres"
echo ""
