const { execSync } = require('child_process');

console.log('🔥 Deploy Frontend Only (No Backend)');
console.log('====================================');

try {
  // Step 1: Build React app
  console.log('📦 Building React app...');
  execSync('cd client && npm install && npm run build', { stdio: 'inherit' });

  // Step 2: Deploy to Firebase Hosting
  console.log('🚀 Deploying to Firebase Hosting...');
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });

  console.log('✅ Frontend deployed successfully!');
  console.log('🔗 Your app: https://servease-07762363-b4f31.web.app');
  console.log('⚠️  Note: Backend API not available (billing required)');
  console.log('💡 To fix: Enable billing in Firebase Console');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('\n🔧 Manual steps:');
  console.log('1. cd client && npm run build');
  console.log('2. firebase deploy --only hosting');
  process.exit(1);
}
