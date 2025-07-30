import { create } from 'zustand';
import { apiService } from '@/lib/api';
import type { LoginRequest, Organization } from '@shared/schema';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedOrganization: Organization | null;
  organizations: Organization[];
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  switchOrganization: (organization: Organization) => void;
  fetchOrganizations: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  isAuthenticated: apiService.isAuthenticated(),
  isLoading: false,
  selectedOrganization: null,
  organizations: [],

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true });
    try {
      await apiService.login(credentials);
      set({ isAuthenticated: true, isLoading: false });
      // Fetch organizations after login
      await get().fetchOrganizations();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    apiService.logout();
    set({ 
      isAuthenticated: false, 
      selectedOrganization: null, 
      organizations: [] 
    });
  },

  checkAuth: () => {
    const isAuthenticated = apiService.isAuthenticated();
    set({ isAuthenticated });
  },

  switchOrganization: (organization: Organization) => {
    localStorage.setItem('selected_organization', JSON.stringify(organization));
    set({ selectedOrganization: organization });
  },

  fetchOrganizations: async () => {
    try {
      const response = await apiService.request<Organization[]>('/organizations/my/');
      const organizations = Array.isArray(response) ? response : [];
      
      // Set first organization as selected if none is selected
      let selectedOrganization = get().selectedOrganization;
      const savedOrg = localStorage.getItem('selected_organization');
      
      if (savedOrg) {
        selectedOrganization = JSON.parse(savedOrg);
      } else if (organizations.length > 0) {
        selectedOrganization = organizations[0];
        localStorage.setItem('selected_organization', JSON.stringify(selectedOrganization));
      }
      
      set({ organizations, selectedOrganization });
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  },
}));
