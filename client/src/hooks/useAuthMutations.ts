import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import type { LoginRequest } from '@/types';

export function useAuthMutations() {
  const queryClient = useQueryClient();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => apiService.login(credentials),
    onSuccess: () => {
      // Clear all queries on login to start fresh
      queryClient.clear();
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => {
      apiService.logout();
      return Promise.resolve();
    },
    onSuccess: () => {
      // Clear all queries on logout
      queryClient.clear();
    },
  });

  return {
    login: loginMutation,
    logout: logoutMutation,
  };
}