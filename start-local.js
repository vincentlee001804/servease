const { spawn } = require('child_process');
const path = require('path');

console.log('🔥 Start Local Development Server');
console.log('=================================');

console.log('Starting backend server...');
const backend = spawn('node', ['server/index.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

console.log('Starting frontend server...');
const frontend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

console.log('✅ Servers started!');
console.log('🔗 Backend: http://localhost:8000');
console.log('🔗 Frontend: http://localhost:3000');
console.log('Press Ctrl+C to stop');
