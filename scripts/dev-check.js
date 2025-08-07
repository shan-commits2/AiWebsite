#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Checking development environment...');

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to install dependencies');
    process.exit(1);
  }
}

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('⚙️ Creating .env file...');
  const envContent = `# Gemini AI Chat Environment Variables
# Get your API key from: https://aistudio.google.com
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
PORT=5000

# Database (optional for local development)
# DATABASE_URL=your_database_url_here
`;
  fs.writeFileSync('.env', envContent);
  console.log('⚠️  Please edit .env file and add your GEMINI_API_KEY');
}

// Check if client build exists for production
if (process.env.NODE_ENV === 'production' && !fs.existsSync('dist')) {
  console.log('🏗️ Building project...');
  try {
    execSync('npm run build:force', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to build project');
    process.exit(1);
  }
}

console.log('✅ Development environment ready!');