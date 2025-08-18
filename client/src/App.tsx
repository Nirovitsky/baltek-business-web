import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocketGlobal } from "@/hooks/useWebSocketGlobal";
import { useEffect, useState } from "react";

// Layout Components
import Sidebar from "@/components/layout/Sidebar";

// Pages
import Login from "@/pages/Login";
import CreateOrganization from "@/pages/CreateOrganization";
import Dashboard from "@/pages/Dashboard";
import Jobs from "@/pages/Jobs";
import CreateJob from "@/pages/CreateJob";
import JobDetails from "@/pages/JobDetails";
import Applications from "@/pages/Applications";
import Messages from "@/pages/Messages";
import Users from "@/pages/Users";
import UserProfile from "@/pages/UserProfile";
import Organization from "@/pages/Organization";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasOrganizations, organizations, checkAuth, fetchOrganizations, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize global WebSocket connection when authenticated
  const { connected } = useWebSocketGlobal();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      // Fetch both user profile and organizations when authenticated
      Promise.all([
        refreshProfile(),
        fetchOrganizations()
      ]).then(() => {
        setIsLoading(false);
      }).catch(error => {
        console.error('Error fetching initial data:', error);
        setIsLoading(false);
      });
    }
  }, [isAuthenticated, fetchOrganizations, refreshProfile]);

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Show loading while fetching organizations
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated but has no organizations, redirect to create organization
  console.log('ProtectedRoute check:', { isAuthenticated, hasOrganizations, organizationsLength: organizations.length });
  if (isAuthenticated && !hasOrganizations) {
    return <Redirect to="/create-organization" />;
  }

  return (
    <div className="dashboard-layout flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, hasOrganizations, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        <Login />
      </Route>
      
      <Route path="/create-organization">
        {!isAuthenticated ? <Redirect to="/login" /> : <CreateOrganization />}
      </Route>
      
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/jobs">
        <ProtectedRoute>
          <Jobs />
        </ProtectedRoute>
      </Route>

      <Route path="/jobs/create">
        <ProtectedRoute>
          <CreateJob />
        </ProtectedRoute>
      </Route>

      <Route path="/jobs/edit/:id">
        <ProtectedRoute>
          <CreateJob />
        </ProtectedRoute>
      </Route>
      
      <Route path="/jobs/:id">
        <ProtectedRoute>
          <JobDetails />
        </ProtectedRoute>
      </Route>
      
      <Route path="/applications">
        <ProtectedRoute>
          <Applications />
        </ProtectedRoute>
      </Route>
      
      <Route path="/messages">
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      </Route>

      <Route path="/users/:id">
        <ProtectedRoute>
          <Users />
        </ProtectedRoute>
      </Route>

      <Route path="/profile/:userId">
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      </Route>
      
      <Route path="/organization">
        <ProtectedRoute>
          <Organization />
        </ProtectedRoute>
      </Route>
      
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="baltek-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
