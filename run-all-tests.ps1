# CapSyncer - Run All Tests
# Comprehensive test runner for all test suites

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CapSyncer - Running All Tests" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$exitCode = 0

# Backend Unit Tests
Write-Host "[1/4] Running Backend Unit Tests..." -ForegroundColor Yellow
Push-Location CapSyncer.Server.Tests
dotnet test --filter "FullyQualifiedName~Unit" --nologo
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Backend unit tests failed" -ForegroundColor Red
    $exitCode = 1
} else {
    Write-Host "✓ Backend unit tests passed" -ForegroundColor Green
}
Pop-Location
Write-Host ""

# Backend Integration Tests
Write-Host "[2/4] Running Backend Integration Tests..." -ForegroundColor Yellow
Push-Location CapSyncer.Server.Tests
dotnet test --filter "FullyQualifiedName~Integration" --nologo
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Backend integration tests failed" -ForegroundColor Red
    $exitCode = 1
} else {
    Write-Host "✓ Backend integration tests passed" -ForegroundColor Green
}
Pop-Location
Write-Host ""

# Frontend Tests
Write-Host "[3/4] Running Frontend Component Tests..." -ForegroundColor Yellow
Push-Location frontend
npm test -- --passWithNoTests --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend tests failed" -ForegroundColor Red
    $exitCode = 1
} else {
    Write-Host "✓ Frontend tests passed" -ForegroundColor Green
}
Pop-Location
Write-Host ""

# E2E Tests (Skipped)
Write-Host "[4/4] E2E Tests - Skipped" -ForegroundColor Cyan
Write-Host "      Requires app to be running. To run manually: cd e2e; npm run test:e2e" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host "================================================" -ForegroundColor Cyan
if ($exitCode -eq 0) {
    Write-Host "  All Tests Passed! ✓" -ForegroundColor Green
} else {
    Write-Host "  Some Tests Failed ✗" -ForegroundColor Red
}
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "To run E2E tests:" -ForegroundColor Yellow
Write-Host "  1. Start app: .\start.ps1" -ForegroundColor White
Write-Host "  2. In new terminal: cd e2e; npm run test:e2e" -ForegroundColor White
Write-Host ""

exit $exitCode
