import { useMutation, useQueryClient } from '@tanstack/react-query';
import { oauth2Service } from '@/lib/oauth2';
import { useAuth } from '@/hooks/useAuth';

export function useAuthMutations() {
  const queryClient = useQueryClient();
  const auth = useAuth();

  // OAuth2 login - redirect to authorization server
  const initiateLoginMutation = useMutation({
    mutationFn: () => oauth2Service.initiateLogin(),
    onError: (error) => {
      console.error('Failed to initiate OAuth2 login:', error);
    },
  });

  // Handle OAuth2 callback
  const handleCallbackMutation = useMutation({
    mutationFn: ({ code, state }: { code: string; state: string }) => 
      oauth2Service.handleCallback(code, state),
    onSuccess: (tokens) => {
      // Update auth state
      auth.setAuthenticated(true);
      auth.checkAuth(); // This will fetch organizations
      // Clear all queries to start fresh
      queryClient.clear();
    },
    onError: (error) => {
      console.error('OAuth2 callback failed:', error);
      auth.setAuthenticated(false);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => {
      return oauth2Service.logout();
    },
    onMutate: () => {
      // Immediately update auth state
      auth.logout();
    },
    onSettled: () => {
      // Clear all queries on logout
      queryClient.clear();
    },
  });

  // Refresh token mutation
  const refreshTokenMutation = useMutation({
    mutationFn: () => oauth2Service.refreshToken(),
    onError: () => {
      // If refresh fails, logout user
      auth.logout();
      queryClient.clear();
    },
  });

  return {
    initiateLogin: initiateLoginMutation,
    handleCallback: handleCallbackMutation,
    logout: logoutMutation,
    refreshToken: refreshTokenMutation,
  };
}