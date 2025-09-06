import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import type { Organization } from '@/types';

export function useOrganizations() {
  const queryClient = useQueryClient();

  // Fetch organizations query
  const {
    data: organizations = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/organizations/', 'owned'],
    queryFn: () => apiService.request<Organization[]>('/organizations/?owned=true'),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Create organization mutation
  const createOrganizationMutation = useMutation({
    mutationFn: (organizationData: any) => 
      apiService.request('/organizations/', {
        method: 'POST',
        body: JSON.stringify(organizationData),
      }),
    onMutate: async (organizationData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/organizations/', 'owned'] });
      
      // Snapshot the previous value
      const previousOrganizations = queryClient.getQueryData(['/organizations/', 'owned']);
      
      // Optimistically update the cache with temporary organization
      const tempId = Date.now(); // Temporary ID for optimistic update
      const optimisticOrganization = {
        id: tempId,
        official_name: organizationData.official_name,
        display_name: organizationData.display_name || organizationData.official_name,
        about_us: organizationData.about_us || '',
        website: organizationData.website || '',
        email: organizationData.email || '',
        phone: organizationData.phone || '',
        category: organizationData.category,
        location: organizationData.location,
        logo: organizationData.logo || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_owner: true,
        projects: organizationData.projects || []
      };
      
      queryClient.setQueryData(['/organizations/', 'owned'], (old: any) => {
        if (!old || !Array.isArray(old)) return [optimisticOrganization];
        return [optimisticOrganization, ...old];
      });
      
      return { previousOrganizations, tempId };
    },
    onError: (err, organizationData, context) => {
      // Rollback on error
      if (context?.previousOrganizations) {
        queryClient.setQueryData(['/organizations/', 'owned'], context.previousOrganizations);
      }
    },
    onSuccess: (data, variables, context) => {
      // Replace temporary organization with real data
      if (context?.tempId && data) {
        queryClient.setQueryData(['/organizations/', 'owned'], (old: any) => {
          if (!old || !Array.isArray(old)) return [data];
          return old.map((org: any) => org.id === context.tempId ? data : org);
        });
        // Also cache the individual organization data
        if (data && typeof data === 'object' && 'id' in data) {
          queryClient.setQueryData(['/organizations/', (data as any).id], data);
        }
      }
      // Invalidate and refetch organizations
      queryClient.invalidateQueries({ queryKey: ['/organizations/', 'owned'] });
      // Also invalidate individual organization queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/organizations/'] });
    },
  });

  // Update organization mutation
  const updateOrganizationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiService.request(`/organizations/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/organizations/', 'owned'] });
      await queryClient.cancelQueries({ queryKey: ['/organizations/', id] });
      
      // Snapshot the previous values
      const previousOrganizations = queryClient.getQueryData(['/organizations/', 'owned']);
      const previousOrganization = queryClient.getQueryData(['/organizations/', id]);
      
      // Optimistically update organization in list
      queryClient.setQueryData(['/organizations/', 'owned'], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((org: any) => {
          if (org.id === id) {
            return { 
              ...org, 
              ...data,
              updated_at: new Date().toISOString()
            };
          }
          return org;
        });
      });
      
      // Optimistically update individual organization if cached
      if (previousOrganization) {
        queryClient.setQueryData(['/organizations/', id], (old: any) => ({
          ...old,
          ...data,
          updated_at: new Date().toISOString()
        }));
      }
      
      return { previousOrganizations, previousOrganization, id };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousOrganizations) {
        queryClient.setQueryData(['/organizations/', 'owned'], context.previousOrganizations);
      }
      if (context?.previousOrganization && context?.id) {
        queryClient.setQueryData(['/organizations/', context.id], context.previousOrganization);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch organizations
      queryClient.invalidateQueries({ queryKey: ['/organizations/', 'owned'] });
    },
  });

  // Upload file mutation (for logos, etc.)
  const uploadFileMutation = useMutation({
    mutationFn: (file: File) => apiService.uploadFile(file),
  });

  // Force refresh organizations
  const refreshOrganizations = () => {
    return queryClient.invalidateQueries({ queryKey: ['/organizations/', 'owned'] });
  };

  return {
    organizations: Array.isArray(organizations) ? organizations : [],
    isLoading,
    error,
    refetch,
    refreshOrganizations,
    createOrganization: createOrganizationMutation,
    updateOrganization: updateOrganizationMutation,
    uploadFile: uploadFileMutation,
  };
}

// Separate hook to fetch organization by ID
export function useOrganizationById(id: number | undefined) {
  return useQuery({
    queryKey: ['/organizations/', id],
    queryFn: () => apiService.request<Organization>(`/organizations/${id}/`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Hook for organization mutations only (no list fetching)
export function useOrganizationMutations() {
  const queryClient = useQueryClient();

  // Update organization mutation
  const updateOrganizationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiService.request(`/organizations/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/organizations/'] });
      
      // Snapshot the previous values
      const previousOrganizations = queryClient.getQueryData(['/organizations/', 'owned']);
      const previousOrganization = queryClient.getQueryData(['/organizations/', id]);
      
      // Optimistically update organization in list
      queryClient.setQueryData(['/organizations/', 'owned'], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((org: any) => {
          if (org.id === id) {
            return { 
              ...org, 
              ...data,
              updated_at: new Date().toISOString()
            };
          }
          return org;
        });
      });
      
      // Optimistically update individual organization if cached
      if (previousOrganization) {
        queryClient.setQueryData(['/organizations/', id], (old: any) => ({
          ...old,
          ...data,
          updated_at: new Date().toISOString()
        }));
      }
      
      return { previousOrganizations, previousOrganization, id };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousOrganizations) {
        queryClient.setQueryData(['/organizations/', 'owned'], context.previousOrganizations);
      }
      if (context?.previousOrganization && context?.id) {
        queryClient.setQueryData(['/organizations/', context.id], context.previousOrganization);
      }
    },
    onSuccess: () => {
      // Invalidate organization details and list
      queryClient.invalidateQueries({ queryKey: ['/organizations/'] });
    },
  });

  // Upload file mutation (for logos, etc.)
  const uploadFileMutation = useMutation({
    mutationFn: (file: File) => apiService.uploadFile(file),
  });

  return {
    updateOrganization: updateOrganizationMutation,
    uploadFile: uploadFileMutation,
  };
}