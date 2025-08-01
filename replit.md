# Baltek Business Dashboard

## Overview
The Baltek Business Dashboard is a React and Express-based application designed for HR managers within the Baltek Karyera platform. It provides tools for managing job postings, reviewing applications, and communicating with candidates, connecting to an existing OpenAPI backend. The project aims to offer a professional UI tailored for business users, streamlining HR operations and enhancing candidate engagement.

## Recent Changes (January 2025)
- ✅ **Migration Completed**: Successfully migrated from Replit Agent to Replit environment
- ✅ **Authentication Fix**: Fixed phone number formatting in login form to match API expectations (8 digits exactly)
- ✅ **Dashboard UI Cleanup**: Removed profile pictures and status badges from recent job postings cards for cleaner appearance
- ✅ **Sidebar Profile Update**: Changed profile card to display phone number instead of email address
- ✅ **File Upload Security Fix**: Fixed WebSocket message sending with attachments to upload files first, then send message with attachment IDs instead of file data
- ✅ **File Upload Proxy Fix**: Fixed server proxy middleware that was converting multipart/form-data to application/json, breaking file uploads
- ✅ **Chat UI Enhancement**: Redesigned message input with borderless textarea, file attach and send buttons positioned at bottom corner
- ✅ **Message Input Improvement**: Removed scrollbar from textarea, updated placeholder text, unified controls in single card layout
- ✅ **Chat Room Enhancement**: Improved "Send Message" functionality in Applications and User Profile pages
- ✅ **Smart Chat Navigation**: System now checks for existing chat rooms before creating new ones
- ✅ **Direct Room Navigation**: Message buttons now automatically open existing chat rooms or create new ones via applications
- ✅ **User Profile Cleanup**: Removed location fields and online status badges as users don't have location data
- ✅ **WebSocket Integration**: Verified real-time messaging functionality works correctly
- ✅ **Development Environment**: All packages installed and workflow running successfully
- ✅ **Applications Fix**: Fixed crash when clicking applicant cards by adding missing Badge component import
- ✅ **UI Improvement**: Converted applications display from cards to professional table layout
- ✅ **Chat System Optimization**: Fixed WebSocket message loops causing repeated room joins
- ✅ **Message Display Enhancement**: Implemented sophisticated date formatting (today/yesterday/date) and chronological ordering
- ✅ **Performance Improvement**: Added rate limiting to member data fetching to prevent API spam
- ✅ **WebSocket Architecture**: Moved WebSocket connection to global scope, initializes immediately after authentication
- ✅ **Sorting Implementation**: Applications and jobs now show newest entries first (by ID and created_at respectively)
- ✅ **Date Format Fix**: Added proper parsing for European date format (DD.MM.YYYY HH:mm:ss) from API
- ✅ **Message Ordering**: Messages now display in chronological order (oldest to newest) with latest at bottom
- ✅ **WebSocket Only Messaging**: Removed fetch requests after sending messages, now relies purely on WebSocket for real-time updates
- ✅ **Chat Room Enhancement**: Room names now display "User Name - Job Title" format with clickable job links
- ✅ **Optimistic Messaging**: Messages appear instantly in chat with proper deduplication when server confirms
- ✅ **Automatic Reconnection**: WebSocket automatically reconnects with exponential backoff when connection is lost
- ✅ **Connection Status**: Enhanced status indicator shows reconnection attempts and manual retry option
- ✅ **Clean UI**: Removed "Sending message..." text, messages appear immediately without loading states
- ✅ **Message Synchronization**: Automatic message refetch when reconnecting or switching rooms to catch missed messages
- ✅ **Offline Resilience**: System handles offline scenarios by resyncing messages when connection is restored
- ✅ **Disconnect Detection**: Tracks when user was disconnected and triggers message resync only when truly needed
- ✅ **Complete Sync**: On reconnection, refreshes both messages and room data to ensure nothing is missed
- ✅ **Automatic Token Refresh**: Enhanced token management prevents concurrent refresh attempts and keeps users logged in
- ✅ **WebSocket Token Handling**: WebSocket reconnection attempts refresh tokens automatically when needed
- ✅ **Primary Color Update**: Applied #1877F2 (Facebook blue) as primary color throughout chat interface
- ✅ **Design Consistency**: Updated all blue color references to use the primary color variable
- ✅ **Sidebar Modernization**: Moved Settings above Profile, added Settings as navigation item, cleaned up profile section design
- ✅ **Settings Page Redesign**: Removed 3-tab structure, consolidated into organized sections (Preferences, Notifications, Security) with modern icons and visual hierarchy
- ✅ **Message Formatting Fix**: Messages now preserve vertical formatting with whitespace-pre-wrap CSS, showing line breaks as written
- ✅ **Replit Migration Complete**: Successfully migrated from Replit Agent to standard Replit environment with working authentication
- ✅ **Phone Number Format Fix**: Fixed authentication to use +993 country code format for Turkmenistan phone numbers
- ✅ **Organization UI Update**: Removed "Organization Profile" header section with icon, streamlined organization details page
- ✅ **Logo Upload Feature**: Implemented functional logo upload with preview, validation, and file size limits in organization settings
- ✅ **Header Cleanup**: Removed "Organization Details" and description text from organization page header
- ✅ **API Field Update**: Changed organization display from "name" to "official_name" field to match API data structure
- ✅ **Dark Mode Implementation**: Added complete dark mode support with theme toggle, CSS variables, and consistent styling across all components
- ✅ **Smooth Theme Transitions**: Enhanced dark/light mode switching with smooth 0.3s CSS transitions for all color properties, improved theme toggle animations

## User Preferences
- Preferred communication style: Simple, everyday language
- Application name: "baltek business" (lowercase "business")
- Primary color: #1877F2 (Facebook blue)
- Backend URL: https://api.baltek.net/api/
- Authentication: Phone number + password (not username)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with CSS variables
- **State Management**: Zustand (authentication), TanStack Query (server state)
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Real-time Communication**: WebSocket server for chat
- **Session Management**: In-memory storage (with planned database integration)

### Data Storage Strategy
- **Current**: In-memory storage (MemStorage class) for development
- **Planned**: PostgreSQL with Drizzle ORM
- **Schema**: Defined in `shared/schema.ts`

### Key Features
- **Authentication**: JWT-based with access/refresh tokens, Zustand for client-side state, protected routes.
- **Job Management**: CRUD operations for job postings, status management, category/location filtering, rich forms.
- **Application Processing**: Review, status management, candidate communication, filtering, search.
- **Real-time Messaging**: WebSocket-based chat with room-based conversations, message persistence, and real-time updates.
- **UI Components**: Comprehensive design system, responsive layout, sidebar navigation, dark/light theme support, consistent form validation.

### Data Flow
- **Client-Side**: Authentication flow, API requests via TanStack Query, WebSocket updates for real-time changes.
- **Server-Side**: Express middleware for HTTP requests, WebSocket for real-time messaging, data persistence via memory/planned PostgreSQL.

### UI/UX Decisions
- **Color Scheme**: Primarily #1877F2 (Facebook blue) for a professional look.
- **Design Approach**: Modern, minimal, and professional, using gradients and card-based sections.
- **Layout**: Responsive design with sidebar navigation and organized content sections.
- **Forms**: Enhanced visual hierarchy, icons, and professional styling, with improved validation feedback.

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: `react`, `react-dom`, `@tanstack/react-query`
- **UI Components**: `@radix-ui/*`, `tailwindcss`, `class-variance-authority`
- **Form Handling**: `react-hook-form`, `@hookform/resolvers`, `zod`
- **Development**: `vite`, `typescript`, `@replit/vite-plugin-runtime-error-modal`

### Backend Dependencies
- **Server**: `express`, `ws` (WebSocket), `connect-pg-simple`
- **Database**: `@neondatabase/serverless`, `drizzle-orm`, `drizzle-zod`
- **Utilities**: `date-fns`, `nanoid`, `clsx`

### Development Tools
- **Build**: `esbuild` (server bundling), `tsx` (development)
- **Database**: `drizzle-kit` (migrations, schema management)
- **Linting**: TypeScript compiler