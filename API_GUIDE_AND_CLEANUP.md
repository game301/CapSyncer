# CapSyncer - Complete API Reference & Database Guide

## 📊 CURRENT DATABASE CONTENTS

### Coworkers (5 entries)

```
ID | Name          | Capacity
---|---------------|----------
1  | Alice Johnson | 40 hours/week
2  | Bob Smith     | 40 hours/week
3  | Carol Davis   | 30 hours/week
4  | Bob Smith     | 40 hours/week (duplicate)
5  | Carol Davis   | 30 hours/week (duplicate)
```

⚠️ **Note:** Duplicates should be cleaned up

### Projects (1 entry)

```
ID | Name
---|-----
1  | Web Portal Redesign
```

### Tasks (2 entries)

```
ID | Name                      | Priority | Status        | Est. Hours | Weekly Effort
---|---------------------------|----------|---------------|------------|---------------
1  | Design mockups            | High     | In progress   | 20         | 5
2  | Backend API implementation | Critical | Not started   | 40         | 10
```

### Assignments (1 entry)

```
ID | CoworkerID | TaskItemID | HoursAssigned
---|------------|------------|---------------
1  | ?          | ?          | ?
```

---

## 🔌 COMPLETE BACKEND API REFERENCE

All endpoints are available at **http://localhost:5128**

### Health & Status Endpoints

```
GET /health
  Response: 200 OK
  Purpose: Aspire health check, returns empty body

GET /api/status
  Response: { "status": "ok", "now": "2026-02-27T08:29:15.4702113Z" }
  Purpose: Simple status check for frontend/monitoring
```

### Coworkers CRUD

```
GET /coworkers
  Returns: Array of all coworkers
  Response: [{ "id": 1, "name": "...", "capacity": 40, "assignments": [] }, ...]

GET /coworkers/{id}
  Returns: Single coworker by ID
  Response: { "id": 1, "name": "Alice Johnson", "capacity": 40, "assignments": [] }

POST /coworkers
  Body: { "name": "string", "capacity": int }
  Returns: Created coworker with ID
  Example: { "name": "John Doe", "capacity": 40 }

PUT /coworkers/{id}
  Body: { "name": "string", "capacity": int }
  Returns: Updated coworker

DELETE /coworkers/{id}
  Returns: 204 No Content
```

### Projects CRUD

```
GET /projects
  Returns: Array of all projects
  Response: [{ "id": 1, "name": "Web Portal Redesign", "tasks": [] }, ...]

GET /projects/{id}
  Returns: Single project by ID

POST /projects
  Body: { "name": "string" }
  Example: { "name": "Mobile App Development" }

PUT /projects/{id}
  Body: { "name": "string" }

DELETE /projects/{id}
  Returns: 204 No Content
```

### Tasks CRUD

```
GET /tasks
  Returns: Array of all tasks
  Response: [{ "id": 1, "name": "...", "priority": "High", "status": "In progress",
              "estimatedHours": 20, "weeklyEffort": 5, "projectId": 1,
              "added": "2026-02-27T...", "completed": null, "note": "..." }, ...]

GET /tasks/{id}
  Returns: Single task by ID

POST /tasks
  Body: { "name": "string", "priority": "string", "status": "string",
          "estimatedHours": number, "weeklyEffort": number, "projectId": int, "note": "string" }
  Example: { "name": "Database design", "priority": "High", "status": "Not started",
             "estimatedHours": 15, "weeklyEffort": 5, "projectId": 1, "note": "Schema design" }
  Valid Priority Values: Minor, Normal, High, Critical
  Valid Status Values: Not started, In progress, Completed, On hold

PUT /tasks/{id}
  Body: { "name": "string", "estimatedHours": number, "projectId": int }
  Note: Only updates name, estimatedHours, and projectId

DELETE /tasks/{id}
  Returns: 204 No Content
```

### Assignments CRUD

```
GET /assignments
  Returns: Array of all assignments (includes Coworker and TaskItem details)
  Response: [{ "id": 1, "coworkerId": 1, "taskItemId": 1, "hoursAssigned": 5,
               "note": "...", "assignedDate": "2026-02-27T...",
               "coworker": { ...coworker data... },
               "taskItem": { ...task data... } }, ...]

GET /assignments/{id}
  Returns: Single assignment with related data

POST /assignments
  Body: { "coworkerId": int, "taskItemId": int, "hoursAssigned": number, "note": "string" }
  Example: { "coworkerId": 1, "taskItemId": 1, "hoursAssigned": 5, "note": "UI design work" }

PUT /assignments/{id}
  Body: { "coworkerId": int, "taskItemId": int, "hoursAssigned": number }

DELETE /assignments/{id}
  Returns: 204 No Content
```

### ⚠️ UNUSED ENDPOINT (TO BE REMOVED)

```
GET /weatherforecast
  Returns: Random weather forecast data
  Status: DEMO ONLY - Not used by frontend
  Action: REMOVE from production
```

---

## 🐳 DOCKER DATABASE INSPECTION COMMANDS

### View Database Container Details

```bash
# List running Docker containers
docker ps

# Look for the postgres container - it will show something like:
# CONTAINER ID   IMAGE           PORTS                    NAMES
# c8e5066350b9   postgres:17.6   127.0.0.1:56366->5432   postgres-3e42972f

# Get detailed information about the container
docker inspect <CONTAINER_ID>

# Example:
docker inspect c8e5066350b9
```

### Connect to Database Shell

```bash
# Connect to PostgreSQL inside the container
docker exec -it <CONTAINER_ID> psql -U postgres -d capsyncerdb

# Once connected, you can run SQL commands:
\dt                              # List all tables
SELECT * FROM "Coworkers";       # View coworkers (note: table names are case-sensitive)
SELECT * FROM "Projects";
SELECT * FROM "Tasks";
SELECT * FROM "Assignments";
\q                               # Quit
```

### View Database Logs

```bash
# Follow logs in real-time
docker logs -f <CONTAINER_ID>

# Get last 100 lines
docker logs --tail 100 <CONTAINER_ID>
```

### Database Connection String

```
Host: localhost
Port: 5432 (exposed from container)
Database: capsyncerdb
Username: postgres
Password: postgres
```

---

## 🧹 CODE CLEANUP RECOMMENDATIONS

### Backend (Program.cs)

#### ❌ REMOVE - Debug Code (Lines 7-11)

```csharp
// debug environment variables
foreach (var env in Environment.GetEnvironmentVariables().Cast<System.Collections.DictionaryEntry>().Where(e => e.Key.ToString()?.Contains("cap") == true || e.Key.ToString()?.Contains("POSTGRES") == true))
{
    Console.WriteLine($"ENV {env.Key}={env.Value}");
}
```

**Reason:** Unnecessary debug logging in production

#### ❌ REMOVE - Unused OpenAPI (Line 15)

```csharp
builder.Services.AddOpenApi();
```

**Reason:** Added but never mapped to endpoint

#### ❓ KEEP or REMOVE - WeatherForecast Endpoint (Lines 64-77)

```csharp
app.MapGet("/weatherforecast", () => { ... });
```

**Decision:** REMOVE - Only used by api-demo-page, not part of core app
Also remove the `summaries` array and `WeatherForecast` record

#### ✅ KEEP - All CRUD Endpoints

- Coworkers endpoints
- Projects endpoints
- Tasks endpoints
- Assignments endpoints

#### ✅ KEEP - Health Endpoints

- `/health` - Required by Aspire
- `/api/status` - Useful for monitoring

### Frontend

#### api-demo-page/page.tsx

**Decision:** KEEP for now as testing/development tool
**If removing:** Delete `/frontend/app/api-demo-page/` directory and remove link from home page

#### Page Links

**Current:** Home page links to both `/dashboard` and `/api-demo-page`
**Recommended:** Keep `/api-demo-page` for development, can hide in production

---

## 📋 CLEANUP CHECKLIST

### Priority 1 - Data Issues

- [ ] Clean duplicate coworkers (IDs 4 and 5 are duplicates of 2 and 3)
  ```
  DELETE FROM "Coworkers" WHERE "Id" IN (4, 5);
  ```
- [ ] Populate all assignments properly (currently may be incomplete)

### Priority 2 - Code Cleanup

- [ ] Remove debug environment variable logging from Program.cs
- [ ] Remove unused OpenAPI service registration
- [ ] Remove `/weatherforecast` endpoint
- [ ] Remove `summaries` array and `WeatherForecast` record

### Priority 3 - Optional

- [ ] Remove `/api-demo-page` if not needed for development
- [ ] Update home page to only show dashboard link

---

## 🎯 WHY FRONTEND IS SHOWING "LOADING"

Possible causes and solutions:

1. **API Base URL Issue**
   - Check: `NEXT_PUBLIC_API_BASEURL` environment variable
   - AppHost should inject it, but if empty, frontend can't reach backend
   - Solution: Verify in browser DevTools Console

2. **CORS Issues**
   - Backend CORS is configured for `localhost:3000`
   - Check browser console for CORS errors
   - Solution: Check Network tab in DevTools, look for blocked requests

3. **Fetch Error Handling**
   - Current dashboard has error handling but may not display errors
   - Solution: Check browser console for JavaScript errors

4. **Slow Data Load**
   - If data exists but takes time to fetch
   - Solution: Check Network tab for slow requests to API

**Verification Steps:**

1. Open `http://localhost:3000/dashboard` in browser
2. Open DevTools (F12)
3. Check Console tab for errors
4. Check Network tab and filter by "coworkers", "projects", etc.
5. Verify requests show 200 status
6. Check request/response bodies

---

## 🚀 NEXT STEPS

1. **Test Full Flow**
   - Verify dashboard loads without "loading" message
   - Confirm data displays from API
   - Test creating new coworker/task via curl or Postman

2. **Clean Database**
   - Remove duplicate coworkers
   - Complete assignment data

3. **Remove Demo Code**
   - Clean Program.cs of unused code
   - Finalize frontend pages

4. **Add Features**
   - Edit/delete functionality from frontend UI
   - Better error handling and messages
   - Validation on inputs

---

**Last Updated:** February 27, 2026  
**Status:** ✅ Backend operational, need to verify frontend data loading
