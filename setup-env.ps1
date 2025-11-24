# Environment Variables Setup Script
# This script helps you organize environment variables into the correct locations

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Environment Variables Setup Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if root .env exists and has content
$rootEnvPath = ".env"
$hasRootEnv = Test-Path $rootEnvPath

if ($hasRootEnv) {
    Write-Host "Found root .env file" -ForegroundColor Yellow
    $rootContent = Get-Content $rootEnvPath -ErrorAction SilentlyContinue
    if ($rootContent) {
        Write-Host "Root .env contains:" -ForegroundColor Green
        $rootContent | ForEach-Object { Write-Host "  $_" }
    }
}

Write-Host "`nYour project needs TWO separate .env files:" -ForegroundColor Yellow
Write-Host "  1. client/.env - For React app (REACT_APP_* variables)" -ForegroundColor White
Write-Host "  2. functions/.env - For Firebase Functions (JWT_SECRET, SMTP, etc.)" -ForegroundColor White
Write-Host ""

# Check existing .env files
$clientEnvExists = Test-Path "client\.env"
$functionsEnvExists = Test-Path "functions\.env"

Write-Host "Current status:" -ForegroundColor Cyan
if ($clientEnvExists) {
    Write-Host "  client/.env: EXISTS" -ForegroundColor Green
} else {
    Write-Host "  client/.env: MISSING" -ForegroundColor Red
}
if ($functionsEnvExists) {
    Write-Host "  functions/.env: EXISTS" -ForegroundColor Green
} else {
    Write-Host "  functions/.env: MISSING" -ForegroundColor Red
}
Write-Host ""

# Create client/.env if it doesn't exist
if (-not $clientEnvExists) {
    Write-Host "Creating client/.env from template..." -ForegroundColor Yellow
    Copy-Item "client\.env.example" "client\.env" -ErrorAction SilentlyContinue
    if (Test-Path "client\.env") {
        Write-Host "  ✓ Created client/.env" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Could not create client/.env (template may not exist)" -ForegroundColor Red
    }
}

# Create functions/.env if it doesn't exist
if (-not $functionsEnvExists) {
    Write-Host "Creating functions/.env from template..." -ForegroundColor Yellow
    Copy-Item "functions\.env.example" "functions\.env" -ErrorAction SilentlyContinue
    if (Test-Path "functions\.env") {
        Write-Host "  ✓ Created functions/.env" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Could not create functions/.env (template may not exist)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Edit client/.env and add your Firebase configuration:" -ForegroundColor White
Write-Host "   - REACT_APP_FIREBASE_API_KEY" -ForegroundColor Gray
Write-Host "   - REACT_APP_FIREBASE_AUTH_DOMAIN" -ForegroundColor Gray
Write-Host "   - REACT_APP_FIREBASE_PROJECT_ID" -ForegroundColor Gray
Write-Host "   - REACT_APP_FIREBASE_STORAGE_BUCKET" -ForegroundColor Gray
Write-Host "   - REACT_APP_FIREBASE_MESSAGING_SENDER_ID" -ForegroundColor Gray
Write-Host "   - REACT_APP_FIREBASE_APP_ID" -ForegroundColor Gray
Write-Host "   - REACT_APP_RECAPTCHA_SITE_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Edit functions/.env and add your server configuration:" -ForegroundColor White
Write-Host "   - JWT_SECRET (generate a new one!)" -ForegroundColor Gray
Write-Host "   - SMTP_USER" -ForegroundColor Gray
Write-Host "   - SMTP_PASS" -ForegroundColor Gray
Write-Host "   - GOOGLE_AI_API_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Generate a new JWT_SECRET:" -ForegroundColor Yellow
Write-Host "   node -e `"console.log(require('crypto').randomBytes(64).toString('hex'))`"" -ForegroundColor Gray
Write-Host ""
Write-Host "4. The root .env file is not used. You can delete it if you want." -ForegroundColor Yellow
Write-Host ""

