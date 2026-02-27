# How to View Your Database Contents

## ✅ Dashboard is Now Fixed!

**Changes Made:**

1. Added fallback API URL: `http://localhost:5128` (so it works even without environment variable)
2. Added console logging to debug issues
3. Improved error messages showing the API URL being used

**Check it now:** http://localhost:3000/dashboard

The dashboard should now display your data instead of showing "Loading..."

---

## 📊 View Database Contents - 3 Methods

### Method 1: Through the Dashboard (Easiest)

Just open: **http://localhost:3000/dashboard**

The dashboard fetches and displays all your database data in a nice UI!

---

### Method 2: Through the API (Quick Check)

Open PowerShell and run these commands to see raw data:

```powershell
# View all coworkers
Invoke-WebRequest -Uri "http://localhost:5128/coworkers" -UseBasicParsing | Select-Object -ExpandProperty Content

# View all projects
Invoke-WebRequest -Uri "http://localhost:5128/projects" -UseBasicParsing | Select-Object -ExpandProperty Content

# View all tasks
Invoke-WebRequest -Uri "http://localhost:5128/tasks" -UseBasicParsing | Select-Object -ExpandProperty Content

# View all assignments
Invoke-WebRequest -Uri "http://localhost:5128/assignments" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Or simply open these URLs in your browser:**

- http://localhost:5128/coworkers
- http://localhost:5128/projects
- http://localhost:5128/tasks
- http://localhost:5128/assignments

---

### Method 3: Directly from PostgreSQL (Most Detailed)

#### Step 1: Get the PostgreSQL container ID

```powershell
docker ps
```

Look for the container with image `postgres:17.6` and copy its CONTAINER ID.

#### Step 2: Connect to the database

```powershell
# Replace <CONTAINER_ID> with your actual container ID
docker exec -it <CONTAINER_ID> psql -U postgres -d capsyncerdb
```

#### Step 3: Run SQL queries

Once connected, you can run these SQL commands:

```sql
-- List all tables
\dt

-- View all data from each table
SELECT * FROM "Coworkers";
SELECT * FROM "Projects";
SELECT * FROM "Tasks";
SELECT * FROM "Assignments";

-- Count records in each table
SELECT COUNT(*) FROM "Coworkers";
SELECT COUNT(*) FROM "Projects";
SELECT COUNT(*) FROM "Tasks";
SELECT COUNT(*) FROM "Assignments";

-- View table schema
\d "Coworkers"

-- Show more detailed info about columns
\d+ "Coworkers"

-- Quit the database shell
\q
```

---

## 📋 What's Currently in Your Database

Based on earlier checks:

### Coworkers: 5 records

| ID  | Name          | Capacity      |
| --- | ------------- | ------------- | ----------- |
| 1   | Alice Johnson | 40 hours/week |
| 2   | Bob Smith     | 40 hours/week |
| 3   | Carol Davis   | 30 hours/week |
| 4   | Bob Smith     | 40 hours/week | ← Duplicate |
| 5   | Carol Davis   | 30 hours/week | ← Duplicate |

### Projects: 1 record

| ID  | Name                |
| --- | ------------------- |
| 1   | Web Portal Redesign |

### Tasks: 2 records

| ID  | Name                       | Priority | Status      | Hours |
| --- | -------------------------- | -------- | ----------- | ----- |
| 1   | Design mockups             | High     | In progress | 20    |
| 2   | Backend API implementation | Critical | Not started | 40    |

### Assignments: 1 record

| ID  | Coworker     | Task                  | Hours Assigned |
| --- | ------------ | --------------------- | -------------- |
| 1   | Alice (ID:1) | Design mockups (ID:1) | 5              |

---

## 🧹 Cleanup Duplicate Data

To remove the duplicate coworkers (IDs 4 and 5):

```powershell
# Step 1: Get container ID
$containerId = (docker ps --filter "ancestor=postgres:17.6" -q)

# Step 2: Run delete command
docker exec -it $containerId psql -U postgres -d capsyncerdb -c 'DELETE FROM "Coworkers" WHERE "Id" IN (4, 5);'

# Step 3: Verify they're gone
docker exec -it $containerId psql -U postgres -d capsyncerdb -c 'SELECT * FROM "Coworkers";'
```

Or use the API:

```powershell
# Delete coworker with ID 4
Invoke-WebRequest -Uri "http://localhost:5128/coworkers/4" -Method Delete -UseBasicParsing

# Delete coworker with ID 5
Invoke-WebRequest -Uri "http://localhost:5128/coworkers/5" -Method Delete -UseBasicParsing

# Verify
Invoke-WebRequest -Uri "http://localhost:5128/coworkers" -UseBasicParsing | Select-Object -ExpandProperty Content
```

---

## 🎯 Quick Database Inspection Script

I've created a script for you: **`view-database.ps1`**

To fix and use it, run these individual commands instead:

```powershell
# Get container
$cid = (docker ps -q --filter "ancestor=postgres:17.6")

# View coworkers
docker exec $cid psql -U postgres -d capsyncerdb -c 'SELECT * FROM "Coworkers";'

# View projects
docker exec $cid psql -U postgres -d capsyncerdb -c 'SELECT * FROM "Projects";'

# View tasks
docker exec $cid psql -U postgres -d capsyncerdb -c 'SELECT * FROM "Tasks";'

# View assignments
docker exec $cid psql -U postgres -d capsyncerdb -c 'SELECT * FROM "Assignments";'
```

---

## 🔧 Troubleshooting

**Dashboard still shows "Loading"?**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for the message: "Dashboard: Fetching data from API: http://localhost:5128"
4. Check Network tab for failed requests

**API not responding?**

```powershell
# Check if backend is running
Invoke-WebRequest -Uri "http://localhost:5128/health" -UseBasicParsing

# Should return status 200
```

**Can't connect to database container?**

```powershell
# Verify container is running
docker ps

# Check container logs
docker logs <CONTAINER_ID>
```

---

## ✅ Summary

**To view database data:**

1. **Easiest:** Open http://localhost:3000/dashboard (now fixed!)
2. **Quick:** Open http://localhost:5128/coworkers in browser
3. **Detailed:** Use `docker exec` to connect to PostgreSQL

**Dashboard is fixed with:**

- Automatic fallback to http://localhost:5128
- Better error messages
- Console logging for debugging

**Refresh your dashboard now to see your data!** 🎉
