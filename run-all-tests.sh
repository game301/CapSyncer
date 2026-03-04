#!/bin/bash
# CapSyncer - Run All Tests
# Comprehensive test runner for all test suites

echo "================================================"
echo "  CapSyncer - Running All Tests"
echo "================================================"
echo ""

exitCode=0

# Backend Unit Tests
echo "[1/4] Running Backend Unit Tests..."
cd CapSyncer.Server.Tests && dotnet test --filter "FullyQualifiedName~Unit" --nologo
if [ $? -ne 0 ]; then
    echo "✗ Backend unit tests failed"
    exitCode=1
else
    echo "✓ Backend unit tests passed"
fi
cd ..
echo ""

# Backend Integration Tests
echo "[2/4] Running Backend Integration Tests..."
cd CapSyncer.Server.Tests && dotnet test --filter "FullyQualifiedName~Integration" --nologo
if [ $? -ne 0 ]; then
    echo "✗ Backend integration tests failed"
    exitCode=1
else
    echo "✓ Backend integration tests passed"
fi
cd ..
echo ""

# Frontend Tests
echo "[3/4] Running Frontend Component Tests..."
cd frontend && npm test -- --passWithNoTests --silent
if [ $? -ne 0 ]; then
    echo "✗ Frontend tests failed"
    exitCode=1
else
    echo "✓ Frontend tests passed"
fi
cd ..
echo ""

# E2E Tests (Optional)
echo "[4/4] E2E Tests (Skipped - Run manually with: cd e2e && npm run test:e2e)"
echo ""

# Summary
echo "================================================"
if [ $exitCode -eq 0 ]; then
    echo "  All Tests Passed! ✓"
else
    echo "  Some Tests Failed ✗"
fi
echo "================================================"
echo ""

echo "To run E2E tests:"
echo "  1. Start app: ./start.sh"
echo "  2. In new terminal: cd e2e && npm run test:e2e"
echo ""

exit $exitCode
