# Logging and Monitoring Guide

## Overview

CapSyncer includes comprehensive logging and monitoring capabilities through **Aspire** (backend) and **client-side error tracking** (frontend).

---

## Backend Monitoring (Aspire Dashboard)

### What's Monitored

1. **OpenTelemetry Traces** - Request/response flows
2. **Metrics** - Performance counters, HTTP requests, runtime stats
3. **Logs** - Structured logging with JSON output
4. **Health Checks** - Database connectivity, service health

### Access the Aspire Dashboard

```powershell
dotnet run --project CapSyncer.AppHost
```

The dashboard opens automatically (typically at `http://localhost:17xxx`).

**Dashboard Features:**

- **Traces**: See all API requests with timing, dependencies
- **Metrics**: CPU, memory, HTTP request rates, database queries
- **Logs**: Structured logs with filtering and search
- **Resources**: Service status (backend, frontend, PostgreSQL)
- **Health**: Database health checks

### Health Endpoints

- `/health` - Kubernetes-style liveness probe (provided by Aspire)
- `/alive` - Readiness probe (provided by Aspire)
- `/api/status` - Detailed status with timestamp, environment, version

### Log Levels

Configured in `backend/appsettings.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore.Database.Command": "Warning"
    }
  }
}
```

**Levels:**

- `Trace` - Most verbose, rarely used
- `Debug` - Detailed debugging info
- `Information` - General informational messages
- `Warning` - Unexpected but recoverable issues
- `Error` - Errors and exceptions
- `Critical` - Critical failures

---

## Frontend Error Tracking

### Error Boundary

All React errors are caught by the `<ErrorBoundary>` component:

```tsx
// Automatically wraps the entire app in app/layout.tsx
<ErrorBoundary>
  <YourApp />
</ErrorBoundary>
```

**Features:**

- Catches React component errors
- Displays user-friendly error UI
- Logs errors with stack traces
- Shows detailed errors in development

### Logger Utility

Use the logger for manual logging:

```typescript
import { logger } from "@/utils/logger";

// Info logging
logger.info("User logged in", { userId: 123 });

// Warnings
logger.warn("API rate limit approaching", { remaining: 10 });

// Error logging
try {
  // ... code
} catch (error) {
  logger.error("Failed to save data", error, { context: "details" });
}

// API-specific logging
logger.logApiError("/api/tasks", "POST", 500, error);
logger.logFetchError("/api/tasks", error);
```

### API Request Logging

Use `fetchWithLogging` for automatic error tracking:

```typescript
import { fetchWithLogging } from "@/utils/logger";

// Automatically logs requests and errors
const response = await fetchWithLogging(`${apiUrl}/api/tasks`);
```

---

## Production Monitoring Setup

### Backend (Recommended: Azure Application Insights)

1. **Add Application Insights package:**

```powershell
cd backend
dotnet add package Azure.Monitor.OpenTelemetry.AspNetCore
```

2 **Enable in `CapSyncer.ServiceDefaults/Extensions.cs`:**

```csharp
// Uncomment these lines (around line 93-96)
if (!string.IsNullOrEmpty(builder.Configuration["APPLICATIONINSIGHTS_CONNECTION_STRING"]))
{
    builder.Services.AddOpenTelemetry()
       .UseAzureMonitor();
}
```

1. **Add connection string to environment variables:**

```powershell
# Production environment
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx...
```

### Frontend (Recommended: Sentry)

1. **Install Sentry:**

```bash
npm install @sentry/nextjs
```

1. **Initialize in `frontend/utils/logger.ts`:**

```typescript
import * as Sentry from "@sentry/nextjs";

// In sendToLoggingService method:
Sentry.captureException(logData);
```

1. **Add Sentry config:**

```typescript
// frontend/sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

---

## Monitoring Best Practices

### 1. Log Levels

- Use `Information` for normal operations
- Use `Warning` for unexpected but recoverable situations
- Use `Error` for failures that need attention
- Avoid logging sensitive data (passwords, tokens, PII)

### 2. Structured Logging

```csharp
// Good - structured
logger.LogInformation("User {UserId} created task {TaskId}", userId, taskId);

// Bad - string concatenation
logger.LogInformation($"User {userId} created task {taskId}");
```

### 3. Health Checks

- Monitor database connectivity
- Check external service availability
- Set up alerts for health check failures

### 4. Metrics to Watch

- **Response Time**: p50, p95, p99 latencies
- **Error Rate**: 4xx and 5xx responses
- **Request Rate**: Requests per second
- **Database**: Query time, connection pool usage

### 5. Alert Thresholds (Production)

- Error rate > 1%
- Response time p95 > 1 second
- Health check failures
- Memory/CPU > 80%

---

## Troubleshooting

### Backend Logs Not Showing in Aspire

**Check:**

1. `builder.AddServiceDefaults()` is called in `Program.cs`
2. ServiceDefaults project reference exists
3. OTLP endpoint is configured (automatic with Aspire)

### Frontend Errors Not Caught

**Check:**

1. ErrorBoundary wraps your components
2. Error occurs in React component tree (not in event handlers)
3. Use logger.error() for non-React errors

### High Log Volume

**Solutions:**

1. Increase log level to `Warning` or `Error`
2. Filter noisy components in `appsettings.json`
3. Use sampling for traces (adjust `tracesSampleRate`)

---

## Development vs Production

| Feature              | Development      | Production            |
| -------------------- | ---------------- | --------------------- |
| **Log Level**        | Information      | Warning/Error         |
| **Console Logs**     | Always           | Errors only           |
| **Aspire Dashboard** | Yes              | No (use App Insights) |
| **Error Details**    | Full stack trace | Sanitized             |
| **Tracing**          | 100% sampled     | 10-25% sampled        |

---

## Quick Commands

```powershell
# View logs in realtime (Aspire Dashboard)
dotnet run --project CapSyncer.AppHost

# Check backend health
curl http://localhost:5128/health
curl http://localhost:5128/api/status

# Test error boundary (frontend)
# Throw error in any component to see ErrorBoundary UI

# Build with production logging
dotnet publish -c Release
npm run build
```

---

## Next Steps

1. ✅ **Logging & Monitoring Enabled** - Aspire + ErrorBoundary
2. 📊 **Aspire Dashboard** - Monitor traces, metrics, logs
3. 🔔 **Production Setup** - Add Application Insights or Sentry
4. 📈 **Set Alerts** - Configure thresholds for errors, latency
5. 🔍 **Custom Metrics** - Add business-specific metrics as needed

For more information:

- [Aspire Observability](https://learn.microsoft.com/dotnet/aspire/fundamentals/telemetry)
- [Azure Application Insights](https://learn.microsoft.com/azure/azure-monitor/app/app-insights-overview)
- [Sentry for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
