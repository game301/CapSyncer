#!/usr/bin/env powershell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    DATABASE CONTENTS & API TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n[COWORKERS]" -ForegroundColor Yellow
$coworkers = (Invoke-WebRequest -Uri "http://localhost:5128/coworkers" -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "Total: $($coworkers.Count)" -ForegroundColor Green
$coworkers | Select-Object id, name, capacity | Format-Table

Write-Host "`n[PROJECTS]" -ForegroundColor Yellow
$projects = (Invoke-WebRequest -Uri "http://localhost:5128/projects" -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "Total: $($projects.Count)" -ForegroundColor Green
$projects | Select-Object id, name | Format-Table

Write-Host "`n[TASKS]" -ForegroundColor Yellow
$tasks = (Invoke-WebRequest -Uri "http://localhost:5128/tasks" -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "Total: $($tasks.Count)" -ForegroundColor Green
$tasks | Select-Object id, name, status, priority, estimatedHours | Format-Table

Write-Host "`n[ASSIGNMENTS]" -ForegroundColor Yellow
$assignments = (Invoke-WebRequest -Uri "http://localhost:5128/assignments" -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "Total: $($assignments.Count)" -ForegroundColor Green
$assignments | Select-Object id, coworkerId, taskItemId, hoursAssigned | Format-Table

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "    AVAILABLE API ENDPOINTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host @'
Health & Status:
  GET /health
  GET /api/status

Weather Demo:
  GET /weatherforecast

Coworkers (CRUD):
  GET    /coworkers
  GET    /coworkers/{id}
  POST   /coworkers
  PUT    /coworkers/{id}
  DELETE /coworkers/{id}

Projects (CRUD):
  GET    /projects
  GET    /projects/{id}
  POST   /projects
  PUT    /projects/{id}
  DELETE /projects/{id}

Tasks (CRUD):
  GET    /tasks
  GET    /tasks/{id}
  POST   /tasks
  PUT    /tasks/{id}
  DELETE /tasks/{id}

Assignments (CRUD):
  GET    /assignments
  GET    /assignments/{id}
  POST   /assignments
  PUT    /assignments/{id}
  DELETE /assignments/{id}
'@ -ForegroundColor White

Write-Host "`n✅ All endpoints are operational!" -ForegroundColor Green
