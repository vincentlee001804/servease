# 🪟 Windows Firebase Deployment Guide

## Quick Fix Steps

### Step 1: Clean Functions Directory
```powershell
cd functions
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
cd ..
```

### Step 2: Deploy Firebase Functions
```powershell
firebase deploy --only functions
```

### Step 3: Build React App
```powershell
cd client
npm install
npm run build
cd ..
```

### Step 4: Deploy to Firebase Hosting
```powershell
firebase deploy --only hosting
```

## Alternative: Use the Windows Script
```powershell
node deploy-windows.js
```

## Expected Results
- ✅ **Frontend**: `https://servease-07762363-b4f31.web.app`
- ✅ **API**: `https://us-central1-servease-07762363-b4f31.cloudfunctions.net/api`
- ✅ **No CORS errors**
- ✅ **Login/register works**

## Troubleshooting
If you get any errors:
1. Make sure you're logged into Firebase: `firebase login`
2. Check your project: `firebase use servease-07762363-b4f31`
3. Try the manual steps above
