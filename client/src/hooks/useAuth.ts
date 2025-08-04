import { create } from 'zustand';
import { apiService } from '@/lib/api';
import type { LoginRequest, Organization, User } from '@shared/schema';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedOrganization: Organization | null;
  organizations: Organization[];
  user: User | null;
  hasOrganizations: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  switchOrganization: (organization: Organization) => void;
  fetchOrganizations: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateSelectedOrganization: (updatedOrg: Organization) => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  isAuthenticated: apiService.isAuthenticated(),
  isLoading: false,
  selectedOrganization: null,
  organizations: [],
  user: null,
  hasOrganizations: false,

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true });
    try {
      await apiService.login(credentials);
      set({ isAuthenticated: true });
      // Fetch organizations after login
      await get().fetchOrganizations();
      set({ isLoading: false });
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
      organizations: [],
      hasOrganizations: false,
      user: null
    });
  },

  checkAuth: () => {
    const isAuthenticated = apiService.isAuthenticated();
    set({ isAuthenticated });
    // If authenticated, fetch organizations to initialize state properly
    if (isAuthenticated) {
      get().fetchOrganizations();
    }
  },

  switchOrganization: (organization: Organization) => {
    localStorage.setItem('selected_organization', JSON.stringify(organization));
    set({ selectedOrganization: organization });
  },

  fetchOrganizations: async () => {
    try {
      const response = await apiService.request<Organization[]>('/organizations/my/');
      console.log('Fetched organizations:', response); // Debug log
      
      // Handle both array and single object responses
      const organizations = Array.isArray(response) ? response : (response ? [response] : []);
      
      if (organizations.length > 0) {
        // Set first organization as selected
        let selectedOrganization = organizations[0];
        const savedOrg = localStorage.getItem('selected_organization');
        
        if (savedOrg) {
          try {
            const parsedOrg = JSON.parse(savedOrg);
            // Use saved org if it matches one of the fetched organizations
            selectedOrganization = organizations.find(org => org.id === parsedOrg.id) || organizations[0];
          } catch {
            selectedOrganization = organizations[0];
          }
        }
        
        localStorage.setItem('selected_organization', JSON.stringify(selectedOrganization));
        
        console.log('Setting organizations:', organizations, 'Selected:', selectedOrganization); // Debug log
        set({ organizations, selectedOrganization, hasOrganizations: true });
      } else {
        console.log('No organizations found for user');
        set({ organizations: [], selectedOrganization: null, hasOrganizations: false });
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      set({ organizations: [], selectedOrganization: null, hasOrganizations: false });
    }
  },

  refreshProfile: async () => {
    try {
      const user = await apiService.request<User>('/users/me/');
      set({ user });
      // Don't return the user to match the Promise<void> return type
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  },

  updateSelectedOrganization: (updatedOrg: Organization) => {
    const { organizations } = get();
    const updatedOrgs = organizations.map(org => 
      org.id === updatedOrg.id ? updatedOrg : org
    );
    localStorage.setItem('selected_organization', JSON.stringify(updatedOrg));
    set({ organizations: updatedOrgs, selectedOrganization: updatedOrg });
  },
}));
