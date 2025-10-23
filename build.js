const fs = require('fs');
const path = require('path');

// Build the client
const { execSync } = require('child_process');

console.log('Building client...');
execSync('cd client && npm install && npm run build', { stdio: 'inherit' });

// Copy build files to root
console.log('Copying build files to root...');
const buildDir = path.join(__dirname, 'client', 'build');
const rootDir = __dirname;

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy all files from client/build to root
const buildFiles = fs.readdirSync(buildDir);
buildFiles.forEach(file => {
  const srcPath = path.join(buildDir, file);
  const destPath = path.join(rootDir, file);
  copyRecursive(srcPath, destPath);
});

console.log('Build complete!');
