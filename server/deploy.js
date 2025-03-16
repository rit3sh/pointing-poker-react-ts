// This file is used by Azure App Service to start the server
const { execSync } = require('child_process');

try {
  // Install dependencies
  console.log('Installing dependencies...');
  execSync('npm install --production', { stdio: 'inherit' });

  // Start the server
  console.log('Starting server...');
  execSync('node dist/index.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Deployment error:', error);
  process.exit(1);
} 