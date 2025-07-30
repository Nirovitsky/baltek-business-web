import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

// Layout Components
import Sidebar from "@/components/layout/Sidebar";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Jobs from "@/pages/Jobs";
import Applications from "@/pages/Applications";
import Messages from "@/pages/Messages";
import UserProfile from "@/pages/UserProfile";
import Organization from "@/pages/Organization";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth, fetchOrganizations, refreshProfile } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch both user profile and organizations when authenticated
      Promise.all([
        refreshProfile(),
        fetchOrganizations()
      ]).catch(error => console.error('Error fetching initial data:', error));
    }
  }, [isAuthenticated, fetchOrganizations, refreshProfile]);

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <Login />}
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
