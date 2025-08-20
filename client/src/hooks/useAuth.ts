import { create } from 'zustand';
import { apiService } from '@/lib/api';
import type { LoginRequest, Organization, User } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedOrganization: Organization | null;
  organizations: Organization[];
  user: User | null;
  hasOrganizations: boolean;
  organizationsFetched: boolean; // Track if organizations have been fetched
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  switchOrganization: (organization: Organization) => void;
  fetchOrganizations: (force?: boolean) => Promise<void>;
  refreshOrganizations: () => Promise<void>; // Force refresh organizations
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
  organizationsFetched: false,

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
      organizationsFetched: false,
      user: null
    });
  },

  checkAuth: () => {
    const isAuthenticated = apiService.isAuthenticated();
    set({ isAuthenticated });
    // Only fetch organizations if authenticated and not already fetched
    if (isAuthenticated && !get().organizationsFetched) {
      get().fetchOrganizations();
    }
  },

  switchOrganization: (organization: Organization) => {
    localStorage.setItem('selected_organization', JSON.stringify(organization));
    set({ selectedOrganization: organization });
  },

  fetchOrganizations: async (force = false) => {
    // Skip if already fetched and not forced
    if (!force && get().organizationsFetched) {
      return;
    }

    try {
      const response = await apiService.request<Organization[]>('/organizations/?owned=true');
      console.log('Fetched organizations:', response); // Debug log
      
      // Handle direct array response
      const organizations = Array.isArray(response) ? response : [];
      
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
        set({ organizations, selectedOrganization, hasOrganizations: true, organizationsFetched: true });
      } else {
        console.log('No organizations found for user');
        set({ organizations: [], selectedOrganization: null, hasOrganizations: false, organizationsFetched: true });
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      set({ organizations: [], selectedOrganization: null, hasOrganizations: false, organizationsFetched: true });
    }
  },

  refreshProfile: async () => {
    try {
      const { user: currentUser } = get();
      if (!currentUser?.id) {
        throw new Error('No user ID available');
      }
      const user = await apiService.request<User>(`/users/${currentUser.id}/`);
      set({ user });
      // Don't return the user to match the Promise<void> return type
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  },

  refreshOrganizations: async () => {
    // Force refresh by setting organizationsFetched to false and calling fetch
    set({ organizationsFetched: false });
    await get().fetchOrganizations(true);
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
