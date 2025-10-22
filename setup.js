const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up ServEase...\n');

// Check if Node.js is installed
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js version: ${nodeVersion}`);
} catch (error) {
  console.error('❌ Node.js is not installed. Please install Node.js v16 or higher.');
  process.exit(1);
}

// Create .env file for server if it doesn't exist
const serverEnvPath = path.join(__dirname, 'server', '.env');
if (!fs.existsSync(serverEnvPath)) {
  const envContent = `# Database
MONGODB_URI=mongodb://localhost:27017/servease

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# JWT
JWT_SECRET=your_jwt_secret_key_here_${Math.random().toString(36).substring(2, 15)}
JWT_EXPIRE=7d

# WhatsApp Integration (Optional)
WHATSAPP_API_URL=your_whatsapp_api_url
WHATSAPP_TOKEN=your_whatsapp_token

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# QR Code Base URL
QR_BASE_URL=http://localhost:3000/vendor
`;

  fs.writeFileSync(serverEnvPath, envContent);
  console.log('✅ Created server/.env file with default configuration');
} else {
  console.log('✅ Server .env file already exists');
}

// Install root dependencies
console.log('\n📦 Installing root dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Root dependencies installed');
} catch (error) {
  console.error('❌ Failed to install root dependencies');
  process.exit(1);
}

// Install server dependencies
console.log('\n📦 Installing server dependencies...');
try {
  execSync('npm install', { cwd: path.join(__dirname, 'server'), stdio: 'inherit' });
  console.log('✅ Server dependencies installed');
} catch (error) {
  console.error('❌ Failed to install server dependencies');
  process.exit(1);
}

// Install client dependencies
console.log('\n📦 Installing client dependencies...');
try {
  execSync('npm install', { cwd: path.join(__dirname, 'client'), stdio: 'inherit' });
  console.log('✅ Client dependencies installed');
} catch (error) {
  console.error('❌ Failed to install client dependencies');
  process.exit(1);
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Make sure MongoDB is running on your system');
console.log('2. Update the server/.env file with your configuration');
console.log('3. Run "npm run dev" to start the development servers');
console.log('4. Open http://localhost:3000 in your browser');
console.log('\n🔗 Useful commands:');
console.log('- npm run dev          # Start both frontend and backend');
console.log('- npm run server       # Start only the backend server');
console.log('- npm run client       # Start only the frontend client');
console.log('- npm run build        # Build the frontend for production');
