const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Firebase configuration...');

// Update axios configuration
const axiosConfigPath = path.join(__dirname, 'client', 'src', 'config', 'axios.js');
let axiosConfig = fs.readFileSync(axiosConfigPath, 'utf8');

// Replace the Firebase URL with the correct one
axiosConfig = axiosConfig.replace(
  /https:\/\/us-central1-servease-xxxxx\.cloudfunctions\.net\/api/,
  'https://us-central1-servease-07762363-b4f31.cloudfunctions.net/api'
);

fs.writeFileSync(axiosConfigPath, axiosConfig);

console.log('✅ Updated axios configuration');
console.log('🔗 API URL: https://us-central1-servease-07762363-b4f31.cloudfunctions.net/api');

// Build the React app
console.log('📦 Building React app...');
const { execSync } = require('child_process');
execSync('cd client && npm run build', { stdio: 'inherit' });

console.log('✅ Frontend built successfully!');
console.log('🚀 Now deploy to Firebase Hosting: firebase deploy --only hosting');
