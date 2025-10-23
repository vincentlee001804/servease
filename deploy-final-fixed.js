const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Final Fixed Firebase Deployment Script');
console.log('========================================');

try {
  // Step 1: Clean install Functions dependencies
  console.log('📦 Installing Firebase Functions dependencies...');
  
  const functionsDir = path.join(__dirname, 'functions');
  const nodeModulesPath = path.join(functionsDir, 'node_modules');
  const packageLockPath = path.join(functionsDir, 'package-lock.json');
  
  if (fs.existsSync(nodeModulesPath)) {
    console.log('🗑️ Removing existing node_modules...');
    execSync(`Remove-Item -Recurse -Force "${nodeModulesPath}"`, { stdio: 'inherit', shell: 'powershell' });
  }
  
  if (fs.existsSync(packageLockPath)) {
    console.log('🗑️ Removing package-lock.json...');
    fs.unlinkSync(packageLockPath);
  }
  
  // Install dependencies
  execSync('cd functions && npm install', { stdio: 'inherit' });

  // Step 2: Deploy Firebase Functions
  console.log('🚀 Deploying Firebase Functions...');
  execSync('firebase deploy --only functions', { stdio: 'inherit' });

  // Step 3: Build React app
  console.log('📦 Building React app...');
  execSync('cd client && npm install && npm run build', { stdio: 'inherit' });

  // Step 4: Deploy to Firebase Hosting
  console.log('🚀 Deploying to Firebase Hosting...');
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });

  console.log('✅ Deployment completed successfully!');
  console.log('🔗 Your app: https://servease-07762363-b4f31.web.app');
  console.log('🔗 API: https://us-central1-servease-07762363-b4f31.cloudfunctions.net/api');
  console.log('🎉 CORS issue should be fixed!');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('\n🔧 Manual steps:');
  console.log('1. cd functions');
  console.log('2. Remove-Item -Recurse -Force node_modules');
  console.log('3. Remove-Item package-lock.json');
  console.log('4. npm install');
  console.log('5. cd ..');
  console.log('6. firebase deploy --only functions');
  console.log('7. cd client && npm run build');
  console.log('8. firebase deploy --only hosting');
  process.exit(1);
}
