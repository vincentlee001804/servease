# Quick Start: Checking Logs for Vendor Issues

## 🚀 Quick Access Methods

### Option 1: Firebase Console (Easiest)
1. Go to: https://console.firebase.google.com
2. Select project: **servease-07762363-b4f31**
3. Click **Functions** → **api** → **Logs** tab

### Option 2: Terminal (Real-time)
```bash
# View logs in real-time
firebase functions:log --tail

# View only errors
firebase functions:log --tail | grep ERROR
```

### Option 3: Google Cloud Console (Most Powerful)
1. Go to: https://console.cloud.google.com/logs/query
2. Select project: **servease-07762363-b4f31**
3. Use query: `severity>=ERROR` to see all errors

## 🔍 When a Vendor Reports an Issue

### Step 1: Get Information
Ask the vendor:
- What were they doing? (e.g., "trying to generate a poster")
- When did it happen? (approximate time)
- What error message did they see? (if any)
- Their email address

### Step 2: Search Logs

**By Email:**
```bash
firebase functions:log | grep "vendor@example.com"
```

**By Time:**
```bash
firebase functions:log --since "2025-01-15T10:00:00"
```

**By User Type:**
```bash
# Customer errors only
firebase functions:log | grep "userType.*customer"

# Vendor errors only
firebase functions:log | grep "userType.*vendor"

# Customer booking issues
firebase functions:log | grep -i "customer.*booking"
```

**By Error Type:**
```bash
# Authentication errors
firebase functions:log | grep -i "auth.*error"

# AI generation errors
firebase functions:log | grep -i "ai.*error"

# All errors
firebase functions:log | grep ERROR
```

### Step 3: Analyze
Look for:
- **ERROR** level logs around the time of the issue
- **Request ID** to trace the full request flow
- **Error messages** and stack traces
- **User context** (userId, email)

## 📊 Common Issues

| Issue | Search Query |
|-------|-------------|
| Login problems | `grep -i "login\|auth"` |
| AI poster generation fails | `grep -i "ai.*poster\|gemini"` |
| Slow performance | `grep "duration.*[0-9]{4,}ms"` |
| Database errors | `grep -i "firestore\|database"` |
| Customer booking issues | `grep -i "customer.*booking\|booking.*customer"` |
| Vendor dashboard issues | `grep -i "vendor.*dashboard\|dashboard.*vendor"` |
| Customer errors only | `grep "userType.*customer"` |
| Vendor errors only | `grep "userType.*vendor"` |

## 💡 Pro Tips

1. **Keep logs open** during testing: `firebase functions:log --tail`
2. **Filter by severity**: Only show errors and warnings
3. **Use requestId**: If vendor provides it, search for full trace
4. **Check client errors**: Also check browser console (F12) for frontend errors

## 📚 Full Documentation

See [LOGGING_GUIDE.md](./LOGGING_GUIDE.md) for complete details.

