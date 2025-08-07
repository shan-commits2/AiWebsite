#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');

console.log(`
========================================
  GEMINI AI CHAT - AUTO SETUP
========================================

This will set up everything you need!
`);

function runCommand(command, description) {
  console.log(`📍 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed`);
    throw error;
  }
}

async function setup() {
  try {
    // Clean install
    if (fs.existsSync('node_modules')) {
      console.log('🧹 Cleaning existing installation...');
      fs.rmSync('node_modules', { recursive: true, force: true });
    }
    
    if (fs.existsSync('package-lock.json')) {
      fs.unlinkSync('package-lock.json');
    }

    runCommand('npm install', 'Installing dependencies');
    
    // Create .env if it doesn't exist
    if (!fs.existsSync('.env')) {
      console.log('⚙️ Creating environment file...');
      const envContent = `# Gemini AI Chat Environment Variables
# Get your API key from: https://aistudio.google.com
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
PORT=5000
`;
      fs.writeFileSync('.env', envContent);
    }

    console.log(`
✅ Setup completed successfully!

🚀 Ready to start:
   npm run dev

🌐 App will be available at:
   http://localhost:5000

⚠️  Don't forget to add your GEMINI_API_KEY to .env file!
`);

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setup();