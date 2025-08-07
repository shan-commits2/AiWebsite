#!/usr/bin/env node
const fs = require('fs');

console.log('🔧 Post-install setup...');

// Create necessary directories
const dirs = ['uploads', 'exports', 'logs'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Create .gitkeep files
dirs.forEach(dir => {
  const gitkeepPath = `${dir}/.gitkeep`;
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
  }
});

console.log('✅ Post-install setup completed!');