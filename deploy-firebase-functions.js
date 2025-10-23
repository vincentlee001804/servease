const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔥 Deploying Firebase Functions...');

try {
  // Install Functions dependencies
  console.log('📦 Installing Firebase Functions dependencies...');
  execSync('cd functions && npm install', { stdio: 'inherit' });

  // Deploy only Functions
  console.log('🚀 Deploying Firebase Functions...');
  execSync('firebase deploy --only functions', { stdio: 'inherit' });

  console.log('✅ Firebase Functions deployed successfully!');
  console.log('🔗 Your API URL should be: https://us-central1-servease-07762363-b4f31.cloudfunctions.net/api');
} catch (error) {
  console.error('❌ Firebase Functions deployment failed:', error.message);
  process.exit(1);
}
