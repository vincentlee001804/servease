# Logging and Error Monitoring Guide

This guide explains how to monitor and debug your ServEase application when testing with vendors.

## 📋 Table of Contents
1. [Overview](#overview)
2. [Accessing Firebase Logs](#accessing-firebase-logs)
3. [Viewing Logs via Firebase CLI](#viewing-logs-via-firebase-cli)
4. [Understanding Log Levels](#understanding-log-levels)
5. [Filtering and Searching Logs](#filtering-and-searching-logs)
6. [Client-Side Error Tracking](#client-side-error-tracking)
7. [Best Practices](#best-practices)

## Overview

Your application now has structured logging in place:

- **Backend (Firebase Functions)**: All logs are automatically sent to Google Cloud Logging
- **Frontend (React)**: Errors are logged to console and optionally sent to backend
- **Structured Context**: All logs include relevant context (userId, requestId, userType, etc.)
- **User Type Tracking**: Logs distinguish between **vendor** and **customer** actions

## Accessing Firebase Logs

### Method 1: Firebase Console (Recommended for Quick Access)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select your project: `servease-07762363-b4f31`

2. **Navigate to Functions Logs**
   - Click on **"Functions"** in the left sidebar
   - Click on your function (e.g., `api`)
   - Click on **"Logs"** tab

3. **Alternative: Cloud Logging**
   - Go to: https://console.cloud.google.com/logs
   - Select your Firebase project
   - You'll see all logs from Firebase Functions

### Method 2: Google Cloud Console (More Advanced)

1. **Direct Link to Logs Explorer**
   - Visit: https://console.cloud.google.com/logs/query
   - Select your project: `servease-07762363-b4f31`

2. **View Logs**
   - All Firebase Functions logs appear here automatically
   - More powerful filtering and querying options

## Viewing Logs via Firebase CLI

You can view logs directly from your terminal:

```bash
# View all function logs
firebase functions:log

# View logs for specific function
firebase functions:log --only api

# View logs in real-time (tail)
firebase functions:log --tail

# View logs with filters
firebase functions:log --only api --limit 50
```

### Filter by Severity
```bash
# View only errors
firebase functions:log --only api | grep ERROR

# View warnings and errors
firebase functions:log --only api | grep -E "(WARNING|ERROR)"
```

## Understanding Log Levels

The logging system uses these severity levels:

- **DEBUG**: Detailed information for debugging (not shown in production by default)
- **INFO**: General informational messages (e.g., "User logged in", "Booking created")
- **NOTICE**: Normal but significant events
- **WARNING**: Warning messages (e.g., "CORS blocked", "Missing configuration")
- **ERROR**: Error events that might still allow the app to continue
- **CRITICAL**: Critical events requiring immediate attention

### Log Format

Each log entry includes:
```json
{
  "severity": "ERROR",
  "message": "AI generate poster error",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "userType": "vendor",
  "userId": "user123",
  "requestId": "abc123",
  "error": {
    "message": "API key not found",
    "stack": "...",
    "code": "ENOTFOUND"
  }
}
```

### User Types

Logs include a `userType` field to distinguish between:
- **`vendor`**: Authenticated vendor users (dashboard, AI tools, profile management)
- **`customer`**: Customer actions (viewing vendor pages, creating bookings, downloading ICS files)
- **`anonymous`**: Unauthenticated requests without clear user context

## Filtering and Searching Logs

### In Google Cloud Console

Use the Logs Explorer query language:

```
# Find all errors
severity>=ERROR

# Find errors for specific user
severity>=ERROR AND jsonPayload.userId="user123"

# Find errors in last hour
severity>=ERROR AND timestamp>="2025-01-15T09:00:00Z"

# Find specific error message
jsonPayload.message="AI generate poster error"

# Find errors with request ID
jsonPayload.requestId="abc123"
```

### In Firebase Console

1. Click on **"Logs"** tab
2. Use the search bar to filter by:
   - Severity level
   - Text in log messages
   - Time range

### Common Queries

```bash
# Find all authentication errors
jsonPayload.message=~"Auth.*error"

# Find all AI generation errors
jsonPayload.message=~"AI.*error"

# Find errors from specific vendor
jsonPayload.email="vendor@example.com"

# Find slow requests (>1 second)
jsonPayload.duration=~"[0-9]{4,}ms"

# Find all customer-related errors
jsonPayload.userType="customer"

# Find all vendor-related errors
jsonPayload.userType="vendor"

# Find customer booking issues
jsonPayload.userType="customer" AND jsonPayload.message=~"booking"

# Find vendor dashboard issues
jsonPayload.userType="vendor" AND jsonPayload.message=~"dashboard"
```

## Client-Side Error Tracking

Client-side errors are automatically:

1. **Logged to Browser Console**: Always visible in development
2. **Sent to Backend**: In production, errors are sent to `/logs/error` endpoint
3. **Stored in Firestore**: Optionally saved to `errorLogs` collection

### Viewing Client Errors

1. **Browser Console**: Open DevTools (F12) → Console tab
2. **Firebase Console**: Check Firestore `errorLogs` collection
3. **Backend Logs**: Client errors appear in Firebase Functions logs with `source: 'client'`

### Example Client Error Log

```json
{
  "message": "Failed to load data",
  "error": "Network request failed",
  "stack": "...",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "url": "https://servease-07762363-b4f31.web.app/en/dashboard",
  "userAgent": "Mozilla/5.0...",
  "userType": "vendor",
  "userId": "user123",
  "action": "loadDashboard"
}
```

## Best Practices

### 1. Monitor During Testing

When testing with vendors:

```bash
# Keep logs open in terminal
firebase functions:log --tail

# Or open in browser
# https://console.cloud.google.com/logs/query?project=servease-07762363-b4f31
```

### 2. Set Up Alerts (Optional)

For production, consider setting up alerts:

1. Go to Google Cloud Console → Logging → Logs-based Metrics
2. Create metric for errors: `severity>=ERROR`
3. Set up alerting policy to notify you via email

### 3. Check Logs When Issues Reported

When a vendor reports an issue:

1. **Get Context**: Ask for:
   - What they were doing
   - When it happened (timestamp)
   - Their user ID or email
   - Any error message they saw

2. **Search Logs**:
   ```bash
   # Search by user email
   firebase functions:log | grep "vendor@example.com"
   
   # Search by time range
   firebase functions:log --since "2025-01-15T10:00:00"
   ```

3. **Use Request ID**: If available, search by requestId for full request trace

### 4. Common Issues and How to Find Them

| Issue | How to Find |
|-------|-------------|
| Authentication failures | `severity>=WARNING AND jsonPayload.message=~"Auth.*"` |
| API errors | `severity>=ERROR AND jsonPayload.message=~"API.*error"` |
| Database errors | `severity>=ERROR AND jsonPayload.message=~"Firestore\|database"` |
| Slow requests | `jsonPayload.duration=~"[0-9]{4,}ms"` |
| CORS issues | `jsonPayload.message=~"CORS"` |
| Customer booking errors | `jsonPayload.userType="customer" AND jsonPayload.message=~"booking"` |
| Vendor dashboard errors | `jsonPayload.userType="vendor" AND jsonPayload.message=~"dashboard"` |
| Customer viewing vendor page errors | `jsonPayload.userType="customer" AND jsonPayload.message=~"vendor"` |

### 5. Log Retention

- **Firebase Console**: Logs retained for 7 days (free tier)
- **Google Cloud Console**: Logs retained based on your plan (default 30 days)
- **Firestore errorLogs**: Stored indefinitely (you manage retention)

## Quick Reference Commands

```bash
# View recent errors
firebase functions:log --only api --limit 20 | grep ERROR

# Monitor in real-time
firebase functions:log --tail

# Search for specific error
firebase functions:log | grep "AI generate poster error"

# View logs for last hour
firebase functions:log --since "1 hour ago"

# Export logs to file
firebase functions:log --only api > logs.txt
```

## Troubleshooting

### Logs Not Appearing?

1. **Check Function Deployment**: Ensure functions are deployed
   ```bash
   firebase deploy --only functions
   ```

2. **Check Project**: Verify you're in the correct Firebase project
   ```bash
   firebase projects:list
   firebase use servease-07762363-b4f31
   ```

3. **Check Permissions**: Ensure you have Viewer or Editor role in Google Cloud

### Too Many Logs?

Use filters to narrow down:
```bash
# Only errors and warnings
firebase functions:log | grep -E "(ERROR|WARNING)"

# Specific function only
firebase functions:log --only api
```

## Additional Resources

- [Firebase Functions Logging Docs](https://firebase.google.com/docs/functions/writing-and-viewing-logs)
- [Google Cloud Logging Docs](https://cloud.google.com/logging/docs)
- [Logs Explorer Query Language](https://cloud.google.com/logging/docs/view/logging-query-language)

---

**Need Help?** Check the logs first! Most issues can be identified by searching for ERROR level logs around the time the issue occurred.

