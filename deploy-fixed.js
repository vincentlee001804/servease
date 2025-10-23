const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔥 Fixed Firebase Deployment Script');
console.log('==================================');

try {
  // Step 1: Install Functions dependencies with updated packages
  console.log('📦 Installing Firebase Functions dependencies...');
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
  console.log('1. cd functions && npm install');
  console.log('2. firebase deploy --only functions');
  console.log('3. cd client && npm run build');
  console.log('4. firebase deploy --only hosting');
  process.exit(1);
}
