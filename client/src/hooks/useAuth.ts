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
      const response = await apiService.request<Organization>('/organizations/my/');
      console.log('Fetched organization:', response); // Debug log
      
      // According to API spec, /api/organizations/my/ returns a single organization object
      if (response && response.id) {
        const organization = response;
        const organizations = [organization]; // Wrap in array for consistency
        
        // Set this organization as selected
        let selectedOrganization = organization;
        const savedOrg = localStorage.getItem('selected_organization');
        
        if (savedOrg) {
          try {
            const parsedOrg = JSON.parse(savedOrg);
            // Use saved org if it matches the fetched one, otherwise use fetched org
            selectedOrganization = parsedOrg.id === organization.id ? parsedOrg : organization;
          } catch {
            selectedOrganization = organization;
          }
        }
        
        localStorage.setItem('selected_organization', JSON.stringify(selectedOrganization));
        
        console.log('Setting organization:', organization, 'Selected:', selectedOrganization); // Debug log
        set({ organizations, selectedOrganization });
      } else {
        console.log('No organization found for user');
        set({ organizations: [], selectedOrganization: null });
      }
    } catch (error) {
      console.error('Failed to fetch organization:', error);
      // If user doesn't have an organization, set empty state
      set({ organizations: [], selectedOrganization: null });
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
