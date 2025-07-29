import { create } from 'zustand';
import { authService } from '@/lib/auth';
import type { LoginRequest } from '@shared/schema';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true });
    try {
      await authService.login(credentials);
      set({ isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ isAuthenticated: false });
  },

  checkAuth: () => {
    const isAuthenticated = authService.isAuthenticated();
    set({ isAuthenticated });
  },
}));
