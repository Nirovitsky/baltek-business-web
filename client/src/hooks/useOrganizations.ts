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
    queryKey: ['/api/organizations/', 'owned'],
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
    onSuccess: () => {
      // Invalidate and refetch organizations
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/', 'owned'] });
    },
  });

  // Update organization mutation
  const updateOrganizationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiService.request(`/organizations/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      // Invalidate and refetch organizations
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/', 'owned'] });
    },
  });

  // Upload file mutation (for logos, etc.)
  const uploadFileMutation = useMutation({
    mutationFn: (file: File) => apiService.uploadFile(file),
  });

  // Force refresh organizations
  const refreshOrganizations = () => {
    return queryClient.invalidateQueries({ queryKey: ['/api/organizations/', 'owned'] });
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
    queryKey: ['/api/organizations/', id],
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
    onSuccess: () => {
      // Invalidate organization details and list
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/'] });
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