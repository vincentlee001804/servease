const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔥 Starting Firebase deployment...');

try {
  // Build the React app
  console.log('📦 Building React app...');
  execSync('cd client && npm install && npm run build', { stdio: 'inherit' });

  // Install Firebase Functions dependencies
  console.log('📦 Installing Firebase Functions dependencies...');
  execSync('cd functions && npm install', { stdio: 'inherit' });

  // Deploy to Firebase
  console.log('🚀 Deploying to Firebase...');
  execSync('firebase deploy', { stdio: 'inherit' });

  console.log('✅ Firebase deployment completed successfully!');
} catch (error) {
  console.error('❌ Firebase deployment failed:', error.message);
  process.exit(1);
}
