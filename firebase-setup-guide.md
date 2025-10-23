# 🔥 Firebase Setup Guide - Fix CORS Issue

## The Problem
Your frontend is deployed on Firebase (`servease-07762363-b4f31.web.app`) but it's trying to call a Vercel API (`servease.vercel.app`). This causes CORS errors.

## The Solution
Deploy your backend API to Firebase Functions and update the frontend configuration.

## Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase
```bash
firebase login
```

## Step 3: Initialize Firebase Project
```bash
firebase init
```

**Select:**
- ✅ **Functions**: Configure a Cloud Functions directory
- ✅ **Hosting**: Configure files for Firebase Hosting

**Configuration:**
- **Functions language**: `JavaScript`
- **Public directory**: `client/build`
- **Single-page app**: `Yes`

## Step 4: Deploy Firebase Functions
```bash
# Install Functions dependencies
cd functions && npm install

# Deploy Functions
firebase deploy --only functions
```

## Step 5: Update Frontend Configuration
The axios configuration has been updated to use:
```
https://us-central1-servease-07762363-b4f31.cloudfunctions.net/api
```

## Step 6: Build and Deploy Frontend
```bash
# Build React app
cd client && npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## Step 7: Test Your App
1. Go to your Firebase Hosting URL
2. Try logging in
3. Check browser console for any errors

## Quick Fix Commands
```bash
# Fix configuration and build
node fix-firebase-config.js

# Deploy Functions only
node deploy-firebase-functions.js

# Deploy everything
firebase deploy
```

## Expected Results
- ✅ Frontend: `https://servease-07762363-b4f31.web.app`
- ✅ API: `https://us-central1-servease-07762363-b4f31.cloudfunctions.net/api`
- ✅ No CORS errors
- ✅ Login should work
