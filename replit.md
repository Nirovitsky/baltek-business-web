# baltek business Dashboard

## Overview
The baltek business Dashboard is a React and Express-based application for HR managers using the baltek Karyera platform. It aims to streamline HR operations by facilitating the management of job postings, review of applications, and communication with candidates. The project provides a professional UI and connects to an existing OpenAPI backend. Its purpose is to enhance candidate engagement and optimize HR workflows.

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
- **Data Fetching**: TanStack Query with comprehensive caching, mutations, and invalidation strategies, including prefetching.
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **Custom Hooks**: `useAuth`, `useAuthMutations`, `useOrganizations`, `useNotifications`, `useUserProfile`, `useReferenceData`
- **Key Features**: JWT-based authentication, CRUD operations for job postings, application processing, WebSocket-based real-time messaging, comprehensive design system, responsive layout, dark/light theme support, and comprehensive internationalization (English, Russian, Turkmen).

### Backend Architecture
- The application connects directly to an external OpenAPI backend at `https://api.baltek.net/api/`.
- Real-time communication is handled via an external WebSocket service at `wss://api.baltek.net/ws/chat/`.
- There is no local backend; all data management and persistence are handled by external services.

### UI/UX Decisions
- **Color Scheme**: Primarily #1877F2 (Facebook blue) for a professional look.
- **Design Approach**: Modern, minimal, and professional, utilizing gradients and card-based sections.
- **Layout**: Responsive design with collapsible sidebar navigation and organized content sections.
- **Forms**: Enhanced visual hierarchy, icons, and professional styling, with improved validation feedback.
- **Dark Mode**: Complete dark mode support with theme toggle and consistent styling.

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: `react`, `react-dom`, `@tanstack/react-query`
- **UI Components**: `@radix-ui/*`, `tailwindcss`, `class-variance-authority`
- **Form Handling**: `react-hook-form`, `@hookform/resolvers`, `zod`
- **Internationalization**: `react-i18next`

### Development Tools
- **Build**: `vite`
- **Linting**: TypeScript compiler