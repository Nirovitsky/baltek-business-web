import { create } from 'zustand';
import { apiService } from '@/lib/api';
import type { LoginRequest, Organization, User } from '@shared/schema';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedOrganization: Organization | null;
  organizations: Organization[];
  user: User | null;
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
      
      console.log('Fetched organizations:', organizations); // Debug log
      
      // Don't update if we already have the same organizations
      const currentOrgs = get().organizations;
      const sameOrgs = currentOrgs.length === organizations.length && 
        currentOrgs.every(org => organizations.find(o => o.id === org.id));
      
      if (sameOrgs) {
        console.log('Organizations unchanged, skipping update');
        return;
      }
      
      // Set first organization as selected if none is selected
      let selectedOrganization = get().selectedOrganization;
      const savedOrg = localStorage.getItem('selected_organization');
      
      if (savedOrg) {
        try {
          const parsedOrg = JSON.parse(savedOrg);
          // Verify the saved org still exists in the fetched organizations
          selectedOrganization = organizations.find(org => org.id === parsedOrg.id) || organizations[0];
        } catch {
          selectedOrganization = organizations[0];
        }
      } else if (organizations.length > 0) {
        selectedOrganization = organizations[0];
      }
      
      if (selectedOrganization) {
        localStorage.setItem('selected_organization', JSON.stringify(selectedOrganization));
      }
      
      console.log('Setting organizations:', organizations, 'Selected:', selectedOrganization); // Debug log
      set({ organizations, selectedOrganization });
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
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
