# Baltek Business Dashboard

## Overview
The Baltek Business Dashboard is a React and Express-based application for HR managers using the Baltek Karyera platform. It facilitates managing job postings, reviewing applications, and communicating with candidates by connecting to an existing OpenAPI backend. The project aims to provide a professional UI, streamline HR operations, and enhance candidate engagement.

## User Preferences
- Preferred communication style: Simple, everyday language
- Application name: "baltek business" (lowercase "business")
- Primary color: #1877F2 (Facebook blue)
- Backend URL: https://api.baltek.net/api/
- Authentication: Phone number + password (not username)

## Recent Changes (January 2025)
- **Migration Completed**: Successfully migrated from Replit Agent to standard Replit environment
- **Performance Optimization**: Fixed redundant organization API calls by implementing caching in authentication hook
- **API Efficiency**: Organizations now fetch only once at login instead of multiple redundant requests to `/organizations/?owned=true`
- **Authentication Updated**: Replaced `/me` endpoint with `/users/{id}` pattern throughout application
- **Notifications System Implemented**: Created real-time notification system using actual backend data from job applications and chat messages
- **Real Data Integration**: Notifications now generated from `/api/jobs/applications/` and `/api/chat/messages/` endpoints
- **Date Handling**: Updated notification date formatting to use ISO strings instead of Unix timestamps
- **No Mock Data**: Removed all mock/placeholder data, using only authentic data from authorized API sources

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with CSS variables
- **State Management**: Zustand (authentication), TanStack Query (server state)
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
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