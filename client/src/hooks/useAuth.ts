import { create } from 'zustand';
import { oauth2Service } from '@/lib/oauth2';
import type { Organization, User } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedOrganization: Organization | null;
  organizations: Organization[];
  user: User | null;
  hasOrganizations: boolean;
  organizationsFetched: boolean;
  logout: () => void;
  checkAuth: () => void;
  switchOrganization: (organization: Organization) => void;
  fetchOrganizations: (force?: boolean) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  updateSelectedOrganization: (updatedOrg: Organization) => void;
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  isAuthenticated: oauth2Service.isAuthenticated(),
  isLoading: false,
  selectedOrganization: null,
  organizations: [],
  user: null,
  hasOrganizations: false,
  organizationsFetched: false,


  logout: () => {
    oauth2Service.logout();
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
    const isAuthenticated = oauth2Service.isAuthenticated();
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
      const response = await oauth2Service.request<Organization[]>('/organizations/?owned=true');
      
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
        
        set({ organizations, selectedOrganization, hasOrganizations: true, organizationsFetched: true });
      } else {
        set({ organizations: [], selectedOrganization: null, hasOrganizations: false, organizationsFetched: true });
      }
    } catch (error) {
      set({ organizations: [], selectedOrganization: null, hasOrganizations: false, organizationsFetched: true });
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

  setUser: (user: User | null) => {
    set({ user });
  },

  setAuthenticated: (authenticated: boolean) => {
    set({ isAuthenticated: authenticated });
  },
}));
