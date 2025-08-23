import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocketGlobal } from "@/hooks/useWebSocketGlobal";
import { useGlobalMessageNotifications } from "@/hooks/useGlobalMessageNotifications";
import { useEffect, useState } from "react";

// Layout Components
import Sidebar from "@/components/layout/Sidebar";

// Pages
import OAuth2Login from "@/pages/OAuth2Login";
import OAuth2Callback from "@/pages/OAuth2Callback";
import CreateOrganization from "@/pages/CreateOrganization";
import Dashboard from "@/pages/Dashboard";
import Jobs from "@/pages/Jobs";
import CreateJob from "@/pages/CreateJob";
import JobDetails from "@/pages/JobDetails";
import Applications from "@/pages/Applications";
import Chat from "@/pages/Chat";
import Notifications from "@/pages/Notifications";
import UserProfile from "@/pages/UserProfile";
import Organization from "@/pages/Organization";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const {
    isAuthenticated,
    hasOrganizations,
    organizations,
    checkAuth,
    organizationsFetched,
  } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Initialize global WebSocket connection when authenticated
  const { connected } = useWebSocketGlobal();
  
  // Initialize global message notifications
  useGlobalMessageNotifications();

  useEffect(() => {
    checkAuth();
  }, []); // Remove checkAuth dependency to prevent repeated calls

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      // Organizations are handled by checkAuth
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show loading while fetching organizations
  if (isLoading || !organizationsFetched) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Only redirect to create-organization if organizations have been fetched and user has none
  // This prevents redirecting before we actually know if they have organizations
  if (isAuthenticated && organizationsFetched && !hasOrganizations) {
    return <Navigate to="/create-organization" replace />;
  }

  return (
    <div className="dashboard-layout flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, hasOrganizations, isLoading } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<OAuth2Login />} />
      <Route path="/oauth2/callback" element={<OAuth2Callback />} />

      <Route
        path="/create-organization"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <CreateOrganization />
          )
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/jobs"
        element={
          <ProtectedRoute>
            <Jobs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/jobs/create"
        element={
          <ProtectedRoute>
            <CreateJob />
          </ProtectedRoute>
        }
      />

      <Route
        path="/jobs/edit/:id"
        element={
          <ProtectedRoute>
            <CreateJob />
          </ProtectedRoute>
        }
      />

      <Route
        path="/jobs/:id"
        element={
          <ProtectedRoute>
            <JobDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/applications"
        element={
          <ProtectedRoute>
            <Applications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/:userId"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/organization"
        element={
          <ProtectedRoute>
            <Organization />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="baltek-ui-theme">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <AppRoutes />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
