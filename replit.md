# Overview

This is a full-stack AI chat application built with React, Express, and PostgreSQL. The application provides a ChatGPT-like interface where users can have conversations with Google's Gemini AI model. Users can create multiple conversations, send messages, and receive AI-generated responses. The application features a modern gray-themed responsive design with enhanced UI elements, syntax highlighting for code blocks, and smooth animations including typing indicators.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React and TypeScript, using a modern component-based architecture:

- **React Router**: Uses Wouter for client-side routing with a simple route structure
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Radix UI components with shadcn/ui styling system for consistent, accessible components
- **Styling**: Tailwind CSS with CSS variables for theming, supporting a dark color scheme
- **Build System**: Vite for fast development and optimized production builds

The application follows a clean component structure with reusable UI components, custom hooks for functionality like toast notifications and mobile detection, and proper TypeScript typing throughout.

## Backend Architecture
The backend uses Express.js with TypeScript in a RESTful API design:

- **Server Framework**: Express.js with middleware for JSON parsing, CORS, and request logging
- **API Design**: RESTful endpoints for conversations and messages with proper HTTP status codes
- **Error Handling**: Centralized error handling middleware for consistent error responses
- **Development Setup**: Vite integration for development mode with hot module replacement

The server implements a clean separation of concerns with dedicated route handlers, storage abstraction, and service layers for AI integration.

## Data Storage
The application uses a flexible data storage approach:

- **Database**: PostgreSQL as the primary database with Neon Database serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema**: Well-defined database schema with conversations and messages tables, including proper relationships
- **Fallback Storage**: In-memory storage implementation for development and testing scenarios
- **Migrations**: Drizzle Kit for database schema migrations and management

The storage layer is abstracted through interfaces, allowing for easy switching between different storage implementations.

## Authentication & Authorization
The application currently uses a simplified user management system:

- **User Schema**: Basic user table with username and password fields
- **Session Management**: Placeholder for session-based authentication
- **Future Enhancement**: The architecture supports adding proper authentication and authorization mechanisms

# External Dependencies

## AI Services
- **Google Gemini AI**: Primary AI service using the @google/genai SDK for generating chat responses and conversation titles
- **API Configuration**: Supports both GEMINI_API_KEY and GOOGLE_AI_API_KEY environment variables
- **Model**: Uses Gemini 2.5 Flash model for text generation

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting for production deployments
- **Connection**: Uses @neondatabase/serverless for optimized serverless database connections
- **Local Development**: Supports standard PostgreSQL connections for local development

## UI and Design System
- **Radix UI**: Comprehensive set of low-level UI primitives for building accessible components
- **Tailwind CSS**: Utility-first CSS framework with custom gray theme and gradient effects
- **Lucide Icons**: Modern icon library for consistent iconography throughout the application
- **React Markdown**: Markdown rendering with syntax highlighting support
- **React Syntax Highlighter**: Code syntax highlighting with Prism.js and oneDark theme
- **Framer Motion**: Smooth animations and transitions for enhanced user experience

## Development and Build Tools
- **TypeScript**: Full TypeScript support across frontend and backend
- **Vite**: Modern build tool for fast development and optimized production builds
- **Drizzle Kit**: Database toolkit for schema management and migrations
- **ESBuild**: Fast JavaScript bundler for server-side code compilation

## Runtime and Hosting
- **Node.js**: Server runtime environment with ES modules support
- **Environment Variables**: Configurable through Replit Secrets system for secure API key management
- **Production Build**: Optimized builds with proper static asset serving and API routing

# Recent Updates (August 2025)

## Comprehensive Feature Implementation
- **Advanced Message System**: Complete message editing, reactions (like/dislike), and bookmarking functionality
- **Multi-Theme Support**: Dark Gray, Blue Dark, Green Dark, and Purple Dark themes with dynamic switching
- **File Upload & Analysis**: Support for images, documents, code files with AI analysis capabilities
- **Voice Input**: Real-time speech-to-text with browser-based speech recognition
- **Export & Sharing**: Multi-format export (TXT, MD, JSON, HTML) with sharing capabilities
- **Analytics Dashboard**: Comprehensive usage tracking with charts and performance insights
- **Model Comparison**: Side-by-side AI model comparison with response time metrics

## Enhanced UI and User Experience
- **Modern Gray Theme**: Sophisticated dark color scheme with blue user bubbles and green AI bubbles
- **Syntax Highlighting**: Full code block highlighting with Prism.js and oneDark theme
- **Advanced Animations**: Typing indicators, smooth transitions, and backdrop blur effects
- **Responsive Design**: Optimized mobile experience with collapsible sidebar
- **Interactive Elements**: Hover effects, optimistic updates, and real-time feedback

## Technical Architecture Enhancements
- **Comprehensive Backend**: File upload handling, message editing APIs, analytics endpoints
- **Enhanced Storage**: Support for user settings, usage statistics, and message reactions
- **Auto-Recovery Setup**: Windows batch script with dependency management and error recovery
- **Type Safety**: Complete TypeScript coverage across frontend and backend
- **Performance Optimizations**: Efficient data fetching, caching, and state management

## Windows Auto-Setup Features
- **Automatic Dependency Installation**: npm install with fallback strategies and error recovery
- **Port Conflict Resolution**: Automatic detection and resolution of port conflicts
- **Build Process Management**: Automatic project building with fallback for development mode
- **Environment Setup**: Automatic .env file creation with proper API key placeholders
- **Error Recovery**: Retry mechanisms for failed installations and server startup issues