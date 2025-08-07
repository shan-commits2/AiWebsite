# Gemini AI Chat - Windows Setup Guide

## 🚀 Quick Start (Automatic)

### Method 1: Windows Batch Script (Recommended)
1. Double-click `setup.bat`
2. The script will automatically:
   - Check Node.js installation
   - Install all dependencies
   - Create environment files
   - Build the project
   - Start the development server

### Method 2: Manual Setup
```cmd
# Clone or download the project
cd gemini-ai-chat

# Run setup script
npm run setup

# Start development server
npm run dev
```

## 📋 Prerequisites

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **Windows 10/11** - This project is optimized for Windows
- **Git** (optional) - For cloning the repository

## 🔧 Troubleshooting

### Problem: "Node.js not found"
**Solution:** Install Node.js from [nodejs.org](https://nodejs.org/) and restart your terminal

### Problem: "npm install fails"
**Solution:** 
```cmd
# Clear npm cache
npm cache clean --force

# Try force install
npm install --force

# Or delete node_modules and reinstall
rmdir /s node_modules
npm install
```

### Problem: "Port 5000 already in use"
**Solution:** Edit `.env` file and change PORT to another number:
```
PORT=3000
```

### Problem: "GEMINI_API_KEY not working"
**Solution:**
1. Get your API key from [Google AI Studio](https://aistudio.google.com)
2. Edit `.env` file:
```
GEMINI_API_KEY=your_actual_api_key_here
```

## 🚀 Features Included

### 🤖 AI & Models
- ✅ Multiple Gemini models (1.5, 2.0, 2.5 Flash)
- ✅ Model comparison mode
- ✅ Custom system prompts
- ✅ Temperature/creativity controls
- ✅ Token usage tracking

### 💬 Chat Experience  
- ✅ Message editing and resending
- ✅ Message reactions (like/dislike)
- ✅ Export conversations (PDF, TXT, MD)
- ✅ Search across all conversations
- ✅ Message bookmarking
- ✅ Conversation folders and tags

### 🎨 Customization
- ✅ Multiple themes (Dark Gray, Blue, Purple, Green)
- ✅ Font size controls
- ✅ Typing speed animations
- ✅ Custom chat backgrounds
- ✅ Message timestamps

### 🔧 Advanced Features
- ✅ File upload and analysis
- ✅ Voice input support
- ✅ Code execution in chat
- ✅ Usage analytics dashboard
- ✅ Auto-save conversations
- ✅ Message templates

### 📊 Analytics & Insights
- ✅ Usage statistics
- ✅ Response time metrics
- ✅ Model performance comparison
- ✅ Chat history visualization

## 🎯 Usage Examples

### Start a new chat:
1. Click "New Chat" in sidebar
2. Select your preferred AI model
3. Start typing your message

### Export conversations:
1. Open any conversation
2. Click the export button
3. Choose format (PDF/TXT/MD)

### Upload and analyze files:
1. Click the attachment icon
2. Select your file (image, text, code)
3. Ask the AI to analyze it

### Compare AI models:
1. Enable comparison mode
2. Send the same message to multiple models
3. Compare their responses side-by-side

## 🛠️ Development

```cmd
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production  
npm run build

# Start production server
npm start

# Check TypeScript
npm run check

# Push database changes
npm run db:push
```

## 📁 Project Structure

```
gemini-ai-chat/
├── client/           # React frontend
├── server/           # Express backend  
├── shared/           # Shared types & schemas
├── scripts/          # Setup and utility scripts
├── uploads/          # File upload storage
├── exports/          # Exported conversations
├── setup.bat         # Windows auto-setup script
└── README-WINDOWS.md # This file
```

## 🔐 Environment Variables

Create `.env` file with:
```env
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
PORT=5000
DATABASE_URL=your_database_url_here (optional)
```

## 🆘 Support

If you encounter any issues:

1. **Check the logs** in your terminal
2. **Restart the app** - Close terminal and run `setup.bat` again
3. **Clear cache** - Delete `node_modules` and run setup again
4. **Update Node.js** - Make sure you have the latest version

## 🎉 You're Ready!

Your comprehensive AI chat platform is ready with ALL the advanced features. Enjoy chatting with multiple AI models and exploring all the productivity features!