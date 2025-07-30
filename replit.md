# Baltek Business Dashboard

## Overview

This is a modern business dashboard for the Baltek Karyera platform built with React and Express. The application connects to an existing OpenAPI backend and provides HR managers with tools to manage job postings, review applications, and communicate with candidates. It features a professional UI using the #1877F2 primary color scheme and is designed specifically for business users rather than job seekers.

## User Preferences

- Preferred communication style: Simple, everyday language
- Application name: "baltek business" (lowercase "business")
- Primary color: #1877F2 (Facebook blue)
- Backend URL: http://116.203.92.15/api/
- Authentication: Phone number + password (not username)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: 
  - Zustand for authentication state
  - TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Real-time Communication**: WebSocket server for chat functionality
- **Session Management**: In-memory storage with future database integration planned

### Data Storage Strategy
- **Current**: In-memory storage (MemStorage class) for development
- **Planned**: PostgreSQL with Drizzle ORM (configuration ready)
- **Migration Ready**: Database schemas defined in shared/schema.ts

## Key Components

### Authentication System
- JWT-based authentication with access/refresh token pattern
- Zustand store for client-side auth state management
- Protected routes with automatic token validation
- Login/logout functionality with proper session handling

### Job Management
- CRUD operations for job postings
- Job status management (open/closed/draft)
- Category and location-based filtering
- Rich job creation forms with validation

### Application Processing
- Application review and status management
- Candidate communication through integrated messaging
- Application filtering and search capabilities

### Real-time Messaging
- WebSocket-based chat system
- Room-based conversations between recruiters and candidates
- Message persistence and history
- Real-time message delivery and status updates

### UI Components
- Comprehensive design system using shadcn/ui
- Responsive layout with sidebar navigation
- Dark/light theme support ready
- Consistent form components with validation states

## Data Flow

### Client-Side Data Management
1. **Authentication Flow**: Login → Token storage → Zustand state update → Protected route access
2. **API Requests**: TanStack Query → API service layer → Express endpoints → Response handling
3. **Real-time Updates**: WebSocket connection → Message broadcasting → UI state updates

### Server-Side Request Processing
1. **HTTP Requests**: Express middleware → Route handlers → Business logic → Response
2. **WebSocket Messages**: Connection management → Message routing → Broadcast to participants
3. **Data Persistence**: Memory storage → Future PostgreSQL integration via Drizzle ORM

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: react, react-dom, @tanstack/react-query
- **UI Components**: @radix-ui/* components, tailwindcss, class-variance-authority
- **Form Handling**: react-hook-form, @hookform/resolvers, zod
- **Development**: vite, typescript, @replit/vite-plugin-runtime-error-modal

### Backend Dependencies
- **Server**: express, ws (WebSocket), connect-pg-simple
- **Database**: @neondatabase/serverless, drizzle-orm, drizzle-zod
- **Utilities**: date-fns, nanoid, clsx

### Development Tools
- **Build**: esbuild for server bundling, tsx for development
- **Database**: drizzle-kit for migrations and schema management
- **Linting**: TypeScript compiler for type checking

## Deployment Strategy

### Development Environment
- **Server**: tsx with hot reloading via NODE_ENV=development
- **Client**: Vite dev server with HMR
- **Database**: Environment variable configuration (DATABASE_URL)

### Production Build Process
1. **Client Build**: `vite build` → Static assets in dist/public
2. **Server Build**: `esbuild` → Bundled server in dist/index.js
3. **Database**: `drizzle-kit push` for schema deployment

### Production Deployment
- **Server**: Node.js process serving bundled application
- **Static Assets**: Served through Express static middleware
- **Database**: PostgreSQL via Neon serverless (configured but not yet implemented)
- **WebSocket**: Integrated WebSocket server on same port as HTTP server

### Environment Configuration
- **Development**: Local development with API proxy to backend server
- **Production**: Express server with API proxy and static asset serving
- **Replit Integration**: Special handling for Replit environment detection and tooling

## Recent Changes (July 30, 2025)
✓ Implemented business switching functionality with dropdown selector
✓ Cleaned up unnecessary database and auth service files since backend handles everything
✓ Added organization filtering to jobs and applications queries  
✓ Updated authentication to fetch and manage multiple organizations
✓ Created comprehensive JobModal component with category/location support
✓ Removed unused storage.ts, auth.ts, and drizzle.config.ts files
✓ Fixed all LSP diagnostics and console errors

### Migration to Replit Environment (July 30, 2025)
✓ Successfully migrated project from Replit Agent to Replit environment
✓ Fixed TypeScript iteration issue in WebSocket connection handling
✓ Verified Express server with integrated Vite development server
✓ Confirmed all dependencies are properly installed and configured
✓ Application running correctly on port 5000 with full functionality
✓ Integrated real-time WebSocket chat functionality with proper authentication
✓ Removed hardcoded tokens and implemented dynamic token-based authentication
✓ Enhanced chat system with backend API integration for message persistence
✓ Fixed server port configuration for Replit compatibility (port 5000)
✓ Added PostgreSQL database support with Drizzle ORM schema
✓ Created comprehensive storage layer for user management and chat functionality
✓ Improved Messages page UI with modern gradients and enhanced styling
✓ Fixed WebSocket error handling and connection status indicators
✓ Implemented proper token verification for WebSocket authentication
✓ Enhanced chat interface with better visual feedback and animations
✓ Added comprehensive file attachment system for photos, documents, and media
✓ Created AttachmentPreview and FileUpload components for modern file handling
✓ Updated database schema to support message attachments with proper metadata
✓ Integrated file upload UI with drag-and-drop support and file type validation