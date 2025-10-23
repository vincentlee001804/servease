const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔥 Complete Firebase Deployment Script');
console.log('=====================================');

try {
  // Step 1: Install Firebase CLI if not installed
  console.log('📦 Checking Firebase CLI...');
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    console.log('✅ Firebase CLI is installed');
  } catch (error) {
    console.log('📦 Installing Firebase CLI...');
    execSync('npm install -g firebase-tools', { stdio: 'inherit' });
  }

  // Step 2: Install Functions dependencies
  console.log('📦 Installing Firebase Functions dependencies...');
  execSync('cd functions && npm install', { stdio: 'inherit' });

  // Step 3: Deploy Firebase Functions
  console.log('🚀 Deploying Firebase Functions...');
  execSync('firebase deploy --only functions', { stdio: 'inherit' });

  // Step 4: Build React app
  console.log('📦 Building React app...');
  execSync('cd client && npm install && npm run build', { stdio: 'inherit' });

  // Step 5: Deploy to Firebase Hosting
  console.log('🚀 Deploying to Firebase Hosting...');
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });

  console.log('✅ Deployment completed successfully!');
  console.log('🔗 Your app should be available at: https://servease-07762363-b4f31.web.app');
  console.log('🔗 API URL: https://us-central1-servease-07762363-b4f31.cloudfunctions.net/api');
  console.log('🎉 CORS issue should be fixed now!');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('\n🔧 Manual steps:');
  console.log('1. firebase login');
  console.log('2. cd functions && npm install');
  console.log('3. firebase deploy --only functions');
  console.log('4. cd client && npm run build');
  console.log('5. firebase deploy --only hosting');
  process.exit(1);
}
