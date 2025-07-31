# Baltek Business Dashboard

## Overview

This is a modern business dashboard for the Baltek Karyera platform built with React and Express. The application connects to an existing OpenAPI backend and provides HR managers with tools to manage job postings, review applications, and communicate with candidates. It features a professional UI using the #1877F2 primary color scheme and is designed specifically for business users rather than job seekers.

## User Preferences

- Preferred communication style: Simple, everyday language
- Application name: "baltek business" (lowercase "business")
- Primary color: #1877F2 (Facebook blue)
- Backend URL: https://api.baltek.net/api/
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

### Migration to Replit Environment (July 30-31, 2025)
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

### Latest Migration Update (July 31, 2025)
✓ Successfully completed migration from Replit Agent to Replit environment
✓ Updated job posting form to align with backend OpenAPI specification
✓ Added missing form fields: education level, salary payment type, job status
✓ Implemented comprehensive language selection with checkbox interface
✓ Fixed required_languages field validation that was causing 400 errors
✓ Enhanced job form with proper field validation and error handling
✓ Added automatic date_started (today) and date_ended (30 days) fields for job postings
✓ Added optional requirements field for detailed job requirements
✓ Made job posting modal larger (max-w-4xl) for better business user experience
✓ Verified all API endpoints working correctly with real backend data
✓ Confirmed languages API integration (Turkmen, Russian, English)
✓ All TypeScript compilation passes without errors or warnings
✓ Migration completed successfully with full business dashboard functionality

### User Profile Enhancement Update (July 31, 2025)
✓ Expanded user schema to match comprehensive OpenAPI specification
✓ Added support for user experiences, educations, projects, and resumes
✓ Enhanced Profile.tsx with comprehensive user information editing
✓ Updated UserProfile.tsx to display rich user profiles with all available data
✓ Added form fields for profession, gender, date of birth, and location selection
✓ Integrated locations API for proper location name display
✓ Created organized sections for work experience, education, projects, and resumes
✓ Implemented proper avatar display with fallback to user initials
✓ Added online status indicators and contact information display
✓ Enhanced UI with color-coded sections for different profile data types
✓ Updated user schema types and exports in shared/schema.ts

### Final Migration Completion (July 31, 2025)
✓ Fixed active jobs count to show real data from API (only "open" status jobs)
✓ Removed notifications button from TopBar component as requested
✓ Resolved TypeScript compilation errors in job status filtering
✓ Verified all package dependencies are properly installed
✓ Confirmed Express server with integrated Vite running correctly on port 5000
✓ All migration checklist items completed successfully
✓ Project fully functional in Replit environment with proper security practices
✓ Fixed Recent Applications component to properly filter by selected organization
✓ Added client-side filtering backup to prevent cross-organization data leakage
✓ Enhanced applications ordering to show most recent applications first
✓ Fixed Applications page to prevent showing applicants from other organizations
✓ Added comprehensive organization filtering for both dashboard and main applications view

### Business Profile Optimization (July 31, 2025)
✓ Simplified current user Profile page to show only essential business information
✓ Removed detailed profile sections (experience, education, projects, resumes) from business user profile
✓ Updated Profile form to only include first name, last name, and optional email
✓ Kept comprehensive UserProfile page for viewing detailed applicant information
✓ Added user profile navigation links throughout the application
✓ Updated Applications page with clickable user profiles routing to /profile/:userId
✓ Enhanced RecentApplications component with proper user profile navigation
✓ Maintained clear separation: basic info for business users, detailed info for applicants

### User Profile Page Enhancement (July 31, 2025)
✓ Fixed React rendering error caused by nested objects in education data
✓ Updated UserEducation schema to handle university as object with location details
✓ Removed duplicate profile header section from UserProfile page
✓ Moved Send Message button into Personal Information card header
✓ Enhanced back button to use browser history instead of hardcoded route
✓ Improved profile layout with avatar and action buttons in single card
✓ Fixed blank page issue and console errors for applicant profile viewing
✓ Removed redundant "Personal Information" header text from profile card
✓ Enhanced Send Message button to redirect to messages with specific user ID
✓ Fixed date formatting throughout frontend to display raw date strings properly
✓ Enhanced CV/Resume section to always show for business users with download options
✓ Added proper file viewing and downloading capabilities for uploaded documents

### Backend URL Migration (July 31, 2025)
✓ Updated backend API URL from http://116.203.92.15 to https://api.baltek.net
✓ Updated server configuration in routes.ts to use new secure endpoint
✓ Updated documentation to reflect new backend URL
✓ Ensured all API proxy requests now route to the updated backend service
✓ Fixed WebSocket connection issues and authentication endpoint errors
✓ Resolved 405 Method Not Allowed error for login API endpoint
✓ Removed CV/Resume section from user profile page as requested

### Chat System Fixes (July 31, 2025)
✓ Fixed WebSocket connection URL construction for Replit environment compatibility
✓ Resolved "Unknown User" display issue in chat rooms with improved fallback handling
✓ Updated "Send Message" button to check for existing rooms and provide informative feedback
✓ Enhanced chat room display names with proper fallbacks ("Chat Room [ID]" instead of "Unknown User")
✓ Improved avatar generation for chat rooms with proper initial handling
✓ Confirmed backend API only supports GET for chat/messages, implemented WebSocket-only messaging
✓ Fixed WebSocket URL generation to handle both localhost development and Replit production environments
✓ Fixed user name display in chat system by properly handling member ID data types and numeric conversion
✓ Resolved API endpoint errors for user profile fetching with proper numeric ID handling
✓ Enhanced chat room display names and avatars to show actual user names instead of "Unknown User"
✓ Completed chat system user profile integration - clicking users now opens their detailed profiles

### Job Details Enhancement (July 31, 2025)
✓ Fixed job detail dialog layout issues - moved action buttons below title to prevent X button conflicts  
✓ Enhanced application count display to use actual backend data from job listings
✓ Updated date fields to use date_started and date_ended instead of created_at/updated_at
✓ Fixed [object Object] errors in location, category, and language API requests
✓ Added proper date validation to prevent "Invalid Date" display
✓ Improved error handling for malformed API responses

### Job Posting Page Migration (July 31, 2025)
✓ Created dedicated CreateJob page replacing modal popup for better user experience
✓ Added comprehensive form layout with organized sections: Basic Information, Job Details, Compensation & Timeline
✓ Implemented gradient design with card-based sections using primary color (#1877F2)
✓ Added proper routing for both creating new jobs (/jobs/create) and editing existing jobs (/jobs/edit/:id)
✓ Updated TopBar component to use page navigation instead of modal callbacks
✓ Modified Jobs, Dashboard, and QuickActions components to redirect to new job posting page
✓ Enhanced form with better visual hierarchy, icons, and professional styling
✓ Maintained full functionality for job creation, editing, and form validation
✓ Removed all JobModal dependencies and updated component architecture

### Job Form Improvements (July 31, 2025)
✓ Redesigned job posting form with elegant, minimal design matching app's existing style
✓ Set default work type to "on site" as requested
✓ Made minimum education optional with proper placeholder text
✓ Removed job status field from form (status automatically set to "open")
✓ Converted required languages from checkboxes to selection box with tag display
✓ Made minimum salary required field with improved UX for number input
✓ Made maximum salary optional with helpful placeholder and description
✓ Removed start date and end date fields as requested
✓ Enhanced form validation with proper schema updates
✓ Improved color scheme using only #1877F2 primary color and neutral grays

### Job Details Page Enhancement (July 31, 2025)
✓ Reordered job details page to show Job Information card first, then Job Description
✓ Added organization name display in Job Information section
✓ Simplified organization display to show only name without extra visual elements
✓ Removed job title, status, and metadata from header section between navigation and action buttons
✓ Added delete button with proper confirmation and error handling
✓ Enhanced page layout for cleaner, more focused user experience
✓ Fixed TypeScript compilation errors and LSP diagnostics
✓ Improved action button positioning and spacing

### Job Postings Cards Redesign (July 31, 2025)
✓ Completely redesigned job cards with modern, professional layout
✓ Implemented responsive grid layout (xl:grid-cols-2) for better space utilization
✓ Added visual hierarchy with organization name, job details, and salary information
✓ Enhanced card styling with hover effects and color transitions
✓ Integrated icons for better visual identification (Building2, MapPin, Users, DollarSign)
✓ Consolidated job type and workplace type information for cleaner display
✓ Added proper salary formatting with payment type display
✓ Improved action buttons with color-coded functionality (view, edit, delete)
✓ Enhanced loading skeleton to match new card design
✓ Fixed API proxy error handling for DELETE operations with empty responses
✓ Improved mobile responsiveness with flexible grid layouts