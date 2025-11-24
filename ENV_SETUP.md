# Environment Variables Setup Guide

## Overview
All API keys and secrets have been moved to environment variables to prevent exposure in the codebase.

## Client Setup (React App)

1. Navigate to the client directory
2. Copy .env.example to .env:
   `ash
   cp .env.example .env
   `
3. Fill in your actual values from Firebase Console:
   - Firebase API Key, Auth Domain, Project ID, etc.
   - reCAPTCHA Site Key

## Functions Setup (Firebase Functions)

### For Local Development:

1. Navigate to the unctions directory
2. Copy .env.example to .env:
   `ash
   cp .env.example .env
   `
3. Fill in your actual values:
   - **JWT_SECRET**: Generate a strong random key:
     `ash
     node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     `
   - **SMTP_USER** and **SMTP_PASS**: Your email credentials
   - **GOOGLE_AI_API_KEY**: Your Google AI API key

4. Install dotenv for local development:
   `ash
   cd functions
   npm install dotenv --save-dev
   `

### For Production (Firebase):

Set environment variables using Firebase CLI:

`ash
# Set JWT Secret
firebase functions:config:set jwt.secret="your-secret-key"

# Set SMTP credentials
firebase functions:config:set smtp.user="your-email@gmail.com"
firebase functions:config:set smtp.pass="your-app-password"

# For secrets (recommended for sensitive data like API keys):
firebase functions:secrets:set GOOGLE_AI_API_KEY
`

Or use Firebase Console:
1. Go to Firebase Console > Functions > Configuration
2. Add environment variables in the "Environment variables" section

## Security Notes

- **NEVER commit .env files to git** (already in .gitignore)
- **Rotate all exposed secrets** that were previously hardcoded
- Use Firebase Secrets for production API keys (more secure than config)
- Generate a new JWT_SECRET and invalidate all existing tokens

## Files Changed

- client/src/config/firebase-config.js - Now uses REACT_APP_* env vars
- unctions/index.js - Now uses JWT_SECRET and SMTP env vars
- unctions/routes/auth.js - Now uses JWT_SECRET env var
- unctions/auth.js - Now uses JWT_SECRET env var

## Next Steps

1. Create .env files from .env.example templates
2. Fill in your actual credentials
3. Test locally to ensure everything works
4. Deploy to Firebase with proper environment variables set
5. **IMPORTANT**: Rotate any exposed secrets immediately
