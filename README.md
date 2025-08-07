# Gemini Chat - AI Chat Application

A modern ChatGPT-like chat interface powered by Google's Gemini AI, built with React, Express, and TypeScript.

## Features

- 🤖 Real-time AI conversations using Google Gemini API
- 💬 Multiple conversation management
- 🎨 Modern dark theme with blue user bubbles and green AI bubbles
- ✨ Syntax highlighting for code blocks
- 📱 Responsive design for mobile and desktop
- ⚡ Instant message display with typing animations
- 🔒 Secure API key management

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Express.js, Node.js
- **AI**: Google Gemini API
- **Database**: PostgreSQL (Neon Database)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom theme

## Quick Start

### Prerequisites

- Node.js 18+
- Google Gemini API Key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd gemini-chat
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - If using Replit: Add `GEMINI_API_KEY` to Replit Secrets
   - If running locally: Create `.env` file with:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:5000`

## Getting a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com)
2. Sign in with your Google account
3. Click "Get API key"
4. Create a new API key for your project
5. Copy the generated key (starts with `AIzaSy...`)

## Project Structure

```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # Utilities
├── server/           # Express backend
│   ├── services/     # API services
│   ├── routes.ts     # API routes
│   └── storage.ts    # Data storage
├── shared/           # Shared types and schemas
└── README.md
```

## Features Overview

### Chat Interface
- Clean, modern design inspired by ChatGPT
- Real-time message display
- Typing indicators
- Message timestamps
- Copy message functionality

### Code Highlighting
- Automatic syntax highlighting for code blocks
- Support for multiple programming languages
- Dark theme optimized for readability

### Conversation Management
- Create multiple conversations
- Auto-generated conversation titles
- Delete conversations
- Conversation history sidebar

## API Routes

- `GET /api/conversations` - Get all conversations
- `POST /api/conversations` - Create new conversation
- `DELETE /api/conversations/:id` - Delete conversation
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Send message

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key (required)
- `NODE_ENV` - Environment (development/production)

## Deployment

### Replit
This project is optimized for Replit deployment:
1. Import to Replit
2. Add GEMINI_API_KEY to Secrets
3. Click Run

### Other Platforms
For deployment on other platforms, ensure:
- Node.js 18+ runtime
- Environment variables configured
- PostgreSQL database (optional, uses in-memory storage by default)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
1. Check the existing issues
2. Create a new issue with detailed description
3. Include steps to reproduce any bugs

---

Built with ❤️ using Google Gemini AI