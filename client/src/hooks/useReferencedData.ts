import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import type { Category, Location, PaginatedResponse } from '@/types';

/**
 * Shared hook for fetching reference data like categories and locations
 * This prevents duplicate queries across different components
 */
export function useReferenceData() {
  // Fetch categories with long cache duration since they rarely change
  const { 
    data: categories = [], 
    isLoading: isLoadingCategories 
  } = useQuery({
    queryKey: ['/categories/'],
    queryFn: () => apiService.request<Category[]>('/categories/'),
    staleTime: 15 * 60 * 1000, // 15 minutes - categories don't change often
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch locations with long cache duration since they rarely change
  const { 
    data: locationsResponse, 
    isLoading: isLoadingLocations 
  } = useQuery({
    queryKey: ['/locations/'],
    queryFn: () => apiService.request<PaginatedResponse<Location>>('/locations/'),
    staleTime: 15 * 60 * 1000, // 15 minutes - locations don't change often
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
  });

  const locations = locationsResponse?.results || [];

  return {
    categories,
    locations,
    isLoadingCategories,
    isLoadingLocations,
    isLoading: isLoadingCategories || isLoadingLocations,
  };
}