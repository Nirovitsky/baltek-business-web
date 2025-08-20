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
    mutationFn: (formData: FormData) =>
      apiService.request<{ url: string }>('/upload/', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type with boundary
      }),
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