#!/bin/bash
# CapSyncer - First Time Setup Script
# Run this script once when you first clone the repository

echo "================================================"
echo "  CapSyncer - First Time Setup"
echo "================================================"
echo ""

# Check if Docker is running
echo "[1/3] Checking Docker..."
if docker ps > /dev/null 2>&1; then
    echo "✓ Docker is running"
else
    echo "✗ Docker is not running. Please start Docker first."
    exit 1
fi

echo ""

# Start PostgreSQL with Docker Compose
echo "[2/3] Starting PostgreSQL database..."
if docker-compose up -d; then
    echo "✓ PostgreSQL started successfully"
else
    echo "✗ Failed to start PostgreSQL"
    exit 1
fi

echo ""

# Install frontend dependencies
echo "[3/3] Installing frontend dependencies..."
cd frontend && npm install
if [ $? -eq 0 ]; then
    echo "✓ Frontend dependencies installed"
    cd ..
else
    echo "✗ Failed to install frontend dependencies"
    exit 1
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
