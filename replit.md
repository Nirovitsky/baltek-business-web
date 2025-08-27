# baltek business Dashboard

## Overview
The baltek business Dashboard is a React and Express-based application for HR managers using the baltek Karyera platform. It facilitates managing job postings, reviewing applications, and communicating with candidates by connecting to an existing OpenAPI backend. The project aims to provide a professional UI, streamline HR operations, and enhance candidate engagement.

## User Preferences
- Preferred communication style: Simple, everyday language
- Application name: "baltek business" (lowercase "business")
- Primary color: #1877F2 (Facebook blue)
- Backend URL: https://api.baltek.net/api/
- Authentication: Phone number + password (not username)

## Recent Changes (January 2025)
- **TanStack Query Migration Completed**: Systematically implemented TanStack Query throughout entire application
- **Performance Optimization**: Fixed redundant organization API calls by implementing caching in authentication hook
- **API Efficiency**: Organizations now fetch only once at login instead of multiple redundant requests to `/organizations/?owned=true`
- **Comprehensive Query Implementation**: Converted all direct API calls to use TanStack Query with proper caching strategies
- **Authentication Hooks Enhanced**: Created `useAuthMutations` for login/logout with query cache invalidation
- **User Profile Hook**: Implemented `useUserProfile` hook for comprehensive user data and chat room management
- **Notifications Performance**: Optimized notifications system with TanStack Query caching (5-minute stale time, disabled refetch on mount/focus)
- **Real Data Integration**: All components now use authentic data from authorized API sources with proper error handling
- **Cache Management**: Proper query invalidation on mutations ensures data consistency across components
- **No Mock Data**: Removed all mock/placeholder data, using only authentic data from authorized API sources
- **Duplicate API Elimination (January 20, 2025)**: Completed systematic removal of all duplicate API calls
  - **Chat Rooms**: Unified fetching across Applications, Messages, and useUserProfile with shared cache key `/chat/rooms/`
  - **Applications**: Synchronized Applications page and notifications hook with shared cache key `/api/jobs/applications/`
  - **Organizations**: Consolidated CreateOrganization and Organization pages to use shared `useOrganizations` hook
  - **Reference Data**: Created `useReferenceData` hook for categories and locations with 15-minute cache duration
  - **Shared Mutations**: All organization operations (create, update, upload) now use centralized mutations with proper invalidation
  - **Cache Optimization**: Long stale times for reference data (categories, locations, languages) that rarely change
- **Migration & Optimization (January 23, 2025)**: Successfully migrated from Replit Agent to Replit environment
  - **Environment Setup**: Configured secure OAuth2 client ID through Replit Secrets
  - **Performance Enhancement**: Optimized `useUserProfile` hook with conditional room fetching to eliminate unnecessary API calls
  - **Applications Page Optimization**: Removed redundant `/chat/rooms/` endpoint fetch, improving page load performance
  - **Migration Completed (January 25, 2025)**: Full migration to Replit production environment completed
    - All dependencies properly installed and configured
    - Workflow setup for continuous development server
    - Environment variables configured through Replit Secrets
    - Application verified working with external API connections
    - Date formatting fixed in RecentJobs dashboard component
    - Ready for deployment to production environment
- **Status Enum Update (January 26, 2025)**: Updated application status handling to reflect API changes
  - Changed "pending" status to "in_review" across all components
  - Updated status filters, colors, and display text
  - Status enum now includes: in_review, ongoing, rejected, hired, expired
  - Maintained consistent status handling across Applications, RecentApplications, QuickActions, and modal components
- **Migration Completion (January 26, 2025)**: Successfully completed migration from Replit Agent to Replit environment
  - Fixed TypeScript configuration for ES2022 compatibility
  - Resolved Node.js import issues with import.meta.url and __dirname
  - Configured OAuth2 Client ID environment variable
  - Fixed status inconsistency between Dashboard and Applications pages
  - All components now consistently use 'in_review' status instead of 'pending'
  - Application runs smoothly on port 5000 with all dependencies properly installed
  - Added comprehensive status debugging to identify backend/frontend status mismatches
  - Enhanced console logging to track status override logic in Applications page
  - **Status Logic Fixed**: Corrected status override behavior to only convert "in_review" to "ongoing" when chat exists, preserving final statuses like "hired" and "rejected"
- **Background Notifications Polling (January 26, 2025)**: Implemented global background polling for notifications
  - Added polling parameter to useNotifications hook with 30-second interval
  - Notifications now automatically check for updates when user is authenticated
  - Organizations receive real-time notification updates even when not on notifications page
  - Polling only runs when authenticated to optimize performance
  - Enhanced notification system for better user engagement
- **Final Migration to Replit Environment (January 26, 2025)**: Successfully completed full migration from Replit Agent to Replit production environment
  - Fixed tsx package installation issues that were preventing server startup
  - Configured OAuth2 Client ID through Replit Secrets for secure authentication
  - All environment variables properly set up for production deployment
  - Application verified running smoothly on port 5000 with external API connectivity
  - Migration checklist completed with all security practices implemented
  - Project now ready for continued development and deployment in Replit environment
- **Final Migration to Replit Environment (January 26, 2025)**: Successfully completed full migration from Replit Agent to Replit production environment
  - Fixed tsx package installation issues that were preventing server startup
  - Configured OAuth2 Client ID through Replit Secrets for secure authentication
  - All environment variables properly set up for production deployment
  - Application verified running smoothly on port 5000 with external API connectivity
  - Migration checklist completed with all security practices implemented
  - Project now ready for continued development and deployment in Replit environment
- **Navigation & UI Updates (January 27, 2025)**: Enhanced sidebar navigation and page organization
  - Moved Settings and Profile (formerly Organization) to bottom section of sidebar navigation
  - Separated main navigation from bottom navigation with visual divider
  - Updated Organization page title to "Profile" for better user clarity
  - Changed Organization navigation icon from Building2 to UserCircle for Profile section
  - Improved navigation hierarchy with dedicated sections for main features vs. user settings
- **Sidebar Migration to shadcn/ui Blocks (January 27, 2025)**: Modernized sidebar to match shadcn/ui design patterns
  - Migrated sidebar to use shadcn/ui Sidebar components (SidebarProvider, SidebarContent, SidebarHeader, SidebarFooter)
  - Implemented collapsible sidebar functionality with SidebarTrigger
  - Enhanced user profile section with dropdown menu for account actions
  - Updated navigation structure with SidebarMenu and SidebarMenuItem components
  - Added professional header with collapse trigger and separator
  - Maintained all existing functionality while improving visual design and user experience
  - Preserved original TopBar component and page layouts to maintain existing functionality
  - Clean integration with SidebarProvider pattern following shadcn/ui best practices
- **Final Migration to Replit Environment (January 27, 2025)**: Successfully completed full migration from Replit Agent to Replit production environment
  - **Security Implementation**: Configured OAuth2 Client ID through Replit Secrets with proper client/server separation
  - **Package Resolution**: Fixed tsx package installation issues that were preventing server startup
  - **Environment Variables**: Properly configured OAuth2 Client ID to be accessible to client-side code through Vite define
  - **Server Configuration**: Updated server to pass OAuth2 Client ID from server environment to client securely
  - **Development Readiness**: Application running smoothly on port 5000 with all dependencies properly configured
  - **Migration Tracking**: Completed comprehensive progress tracker with all items marked as done
  - **OAuth2 Configuration**: Confirmed prompt="login" parameter is properly configured for fresh authentication
  - **Production Ready**: All environment variables configured, security best practices implemented, deployment ready

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with CSS variables
- **State Management**: Zustand (authentication), TanStack Query (server state)
- **Data Fetching**: TanStack Query with comprehensive caching, mutations, and invalidation strategies
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **Custom Hooks**: `useAuth`, `useAuthMutations`, `useOrganizations`, `useNotifications`, `useUserProfile`
- **Key Features**: JWT-based authentication, CRUD operations for job postings, application processing, WebSocket-based real-time messaging, comprehensive design system, responsive layout, dark/light theme support.

### Backend Architecture
- **External API**: Direct connection to https://api.baltek.net/api/
- **Real-time Communication**: External WebSocket service at wss://api.baltek.net/ws/chat/
- **No Local Backend**: The frontend connects directly to external services.

### Data Storage Strategy
- **External API**: All data is managed by the external Baltek API backend.
- **Local Types**: Type definitions are maintained in `client/src/types/index.ts`.
- **No Local Storage**: All persistence is handled by external services.

### UI/UX Decisions
- **Color Scheme**: Primarily #1877F2 (Facebook blue) for a professional look.
- **Design Approach**: Modern, minimal, and professional, utilizing gradients and card-based sections.
- **Layout**: Responsive design with sidebar navigation and organized content sections.
- **Forms**: Enhanced visual hierarchy, icons, and professional styling, with improved validation feedback.
- **Dark Mode**: Complete dark mode support with theme toggle and consistent styling.

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: `react`, `react-dom`, `@tanstack/react-query`
- **UI Components**: `@radix-ui/*`, `tailwindcss`, `class-variance-authority`
- **Form Handling**: `react-hook-form`, `@hookform/resolvers`, `zod`

### Development Tools
- **Build**: `vite`
- **Linting**: TypeScript compiler