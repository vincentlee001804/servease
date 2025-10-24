const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Deploy Frontend with Fixed Configuration');
console.log('==========================================');

try {
  // Step 1: Build React app
  console.log('📦 Building React app...');
  execSync('cd client && npm install && npm run build', { stdio: 'inherit' });

  // Step 2: Check if build directory exists
  const buildDir = path.join(__dirname, 'client', 'build');
  if (!fs.existsSync(buildDir)) {
    throw new Error('Build directory not found. Build failed.');
  }

  // Step 3: Deploy to Firebase Hosting
  console.log('🚀 Deploying to Firebase Hosting...');
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });

  console.log('✅ Frontend deployed successfully!');
  console.log('🔗 Your app: https://servease-07762363-b4f31.web.app');
  console.log('🔗 Login page: https://servease-07762363-b4f31.web.app/login');
  console.log('✅ All routes should work now!');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('\n🔧 Manual steps:');
  console.log('1. cd client && npm run build');
  console.log('2. firebase deploy --only hosting');
  process.exit(1);
}
