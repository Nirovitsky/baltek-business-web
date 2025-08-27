import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/lib/api';

// Aggressive background prefetching when user is idle
function useIdlePrefetch(queryClient: any, selectedOrganization: any) {
  useEffect(() => {
    if (!selectedOrganization?.id) return;
    
    let idleTimer: NodeJS.Timeout;
    
    const startIdlePrefetch = () => {
      // After 3 seconds of idle, start prefetching everything
      idleTimer = setTimeout(() => {
        // Prefetch all possible data in background
        const prefetchTasks = [
          // Core app data
          queryClient.prefetchQuery({
            queryKey: ['/jobs/', selectedOrganization.id],
            queryFn: () => apiService.request(`/jobs/?organization=${selectedOrganization.id}`),
            staleTime: 2 * 60 * 1000,
          }),
          queryClient.prefetchQuery({
            queryKey: ['/jobs/applications/', selectedOrganization.id],
            queryFn: () => apiService.request(`/jobs/applications/?organization=${selectedOrganization.id}`),
            staleTime: 2 * 60 * 1000,
          }),
          queryClient.prefetchQuery({
            queryKey: ['/chat/rooms/'],
            queryFn: () => apiService.request('/chat/rooms/'),
            staleTime: 2 * 60 * 1000,
          }),
          queryClient.prefetchQuery({
            queryKey: ['/notifications/', selectedOrganization.id],
            queryFn: () => apiService.request(`/notifications/?organization=${selectedOrganization.id}`),
            staleTime: 5 * 60 * 1000,
          }),
          // Form reference data
          queryClient.prefetchQuery({
            queryKey: ['/categories/'],
            queryFn: () => apiService.request('/categories/'),
            staleTime: 15 * 60 * 1000,
          }),
          queryClient.prefetchQuery({
            queryKey: ['/locations/'],
            queryFn: () => apiService.request('/locations/'),
            staleTime: 15 * 60 * 1000,
          }),
        ];
        
        // Execute all prefetch tasks
        Promise.allSettled(prefetchTasks).catch(() => {
          // Silently handle any prefetch errors
        });
      }, 3000);
    };
    
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      startIdlePrefetch();
    };
    
    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });
    
    // Start initial timer
    startIdlePrefetch();
    
    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer, true);
      });
    };
  }, [queryClient, selectedOrganization?.id]);
}

export function usePrefetch() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { selectedOrganization } = useAuth();
  
  // Start aggressive background prefetching when idle
  useIdlePrefetch(queryClient, selectedOrganization);

  // Prefetch core data that's commonly needed across the app
  const prefetchCoreData = useCallback(async () => {
    if (!selectedOrganization?.id) return;

    // Prefetch reference data (categories, locations) - these rarely change
    queryClient.prefetchQuery({
      queryKey: ['/categories/'],
      queryFn: () => apiService.request('/categories/'),
      staleTime: 15 * 60 * 1000, // 15 minutes
    });

    queryClient.prefetchQuery({
      queryKey: ['/locations/'],
      queryFn: () => apiService.request('/locations/'),
      staleTime: 15 * 60 * 1000, // 15 minutes
    });

    // Prefetch notifications in background
    queryClient.prefetchQuery({
      queryKey: ['/notifications/', selectedOrganization.id],
      queryFn: () => apiService.request(`/notifications/?organization=${selectedOrganization.id}`),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }, [queryClient, selectedOrganization?.id]);

  // Prefetch jobs data
  const prefetchJobs = useCallback(async () => {
    if (!selectedOrganization?.id) return;

    queryClient.prefetchQuery({
      queryKey: ['/jobs/', selectedOrganization.id],
      queryFn: () => apiService.request(`/jobs/?organization=${selectedOrganization.id}`),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  }, [queryClient, selectedOrganization?.id]);

  // Prefetch applications data
  const prefetchApplications = useCallback(async () => {
    if (!selectedOrganization?.id) return;

    queryClient.prefetchQuery({
      queryKey: ['/jobs/applications/', selectedOrganization.id],
      queryFn: () => apiService.request(`/jobs/applications/?organization=${selectedOrganization.id}`),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  }, [queryClient, selectedOrganization?.id]);

  // Prefetch chat rooms
  const prefetchChatRooms = useCallback(async () => {
    queryClient.prefetchQuery({
      queryKey: ['/chat/rooms/'],
      queryFn: () => apiService.request('/chat/rooms/'),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  }, [queryClient]);

  // Prefetch form reference data for job creation
  const prefetchFormData = useCallback(async () => {
    // Prefetch categories and locations for job creation forms
    queryClient.prefetchQuery({
      queryKey: ['/categories/'],
      queryFn: () => apiService.request('/categories/'),
      staleTime: 15 * 60 * 1000, // 15 minutes
    });

    queryClient.prefetchQuery({
      queryKey: ['/locations/'],
      queryFn: () => apiService.request('/locations/'),
      staleTime: 15 * 60 * 1000, // 15 minutes
    });
  }, [queryClient]);

  // Smart prefetching based on current route
  useEffect(() => {
    const currentPath = location.pathname;

    // Always prefetch core data
    prefetchCoreData();

    // Route-specific prefetching
    switch (currentPath) {
      case '/':
        // From Dashboard, likely to go to Jobs or Applications
        setTimeout(() => {
          prefetchJobs();
          prefetchApplications();
          prefetchFormData(); // Prefetch form data for quick job creation
        }, 1000); // Delay to not interfere with current page load
        break;

      case '/jobs':
        // From Jobs, likely to go to Applications or Chat
        setTimeout(() => {
          prefetchApplications();
          prefetchChatRooms();
        }, 1000);
        break;

      case '/applications':
        // From Applications, likely to go to Chat or Jobs
        setTimeout(() => {
          prefetchChatRooms();
          prefetchJobs();
        }, 1000);
        break;

      case '/chat':
        // From Chat, likely to go back to Applications
        setTimeout(() => {
          prefetchApplications();
        }, 1000);
        break;

      default:
        // For other routes, prefetch commonly accessed data
        setTimeout(() => {
          prefetchJobs();
          prefetchApplications();
        }, 2000); // Longer delay for less common routes
        break;
    }
  }, [location.pathname, prefetchCoreData, prefetchJobs, prefetchApplications, prefetchChatRooms]);

  // Return individual prefetch functions for manual triggering
  return {
    prefetchJobs,
    prefetchApplications,
    prefetchChatRooms,
    prefetchCoreData,
    prefetchFormData,
  };
}

// Hook for prefetching specific route data on hover
export function useHoverPrefetch() {
  const queryClient = useQueryClient();
  const { selectedOrganization } = useAuth();

  const prefetchRoute = useCallback((route: string) => {
    if (!selectedOrganization?.id) return;
    
    console.log(`[Prefetch] Attempting to prefetch route: ${route}`);

    const prefetchMap: Record<string, () => void> = {
      '/jobs': () => {
        console.log(`[Prefetch] Fetching jobs for organization: ${selectedOrganization.id}`);
        queryClient.prefetchQuery({
          queryKey: ['/jobs/', selectedOrganization.id],
          queryFn: () => apiService.request(`/jobs/?organization=${selectedOrganization.id}`),
          staleTime: 2 * 60 * 1000,
        });
        // Also prefetch form data for job creation
        queryClient.prefetchQuery({
          queryKey: ['/categories/'],
          queryFn: () => apiService.request('/categories/'),
          staleTime: 15 * 60 * 1000,
        });
        queryClient.prefetchQuery({
          queryKey: ['/locations/'],
          queryFn: () => apiService.request('/locations/'),
          staleTime: 15 * 60 * 1000,
        });
      },
      '/applications': () => {
        console.log(`[Prefetch] Fetching applications for organization: ${selectedOrganization.id}`);
        queryClient.prefetchQuery({
          queryKey: ['/jobs/applications/', selectedOrganization.id],
          queryFn: () => apiService.request(`/jobs/applications/?organization=${selectedOrganization.id}`),
          staleTime: 2 * 60 * 1000,
        });
      },
      '/chat': () => {
        queryClient.prefetchQuery({
          queryKey: ['/chat/rooms/'],
          queryFn: () => apiService.request('/chat/rooms/'),
          staleTime: 2 * 60 * 1000,
        });
      },
      '/notifications': () => {
        queryClient.prefetchQuery({
          queryKey: ['/notifications/', selectedOrganization.id],
          queryFn: () => apiService.request(`/notifications/?organization=${selectedOrganization.id}`),
          staleTime: 5 * 60 * 1000,
        });
      },
      '/organization': () => {
        console.log(`[Prefetch] Fetching organizations data`);
        queryClient.prefetchQuery({
          queryKey: ['/organizations/', 'owned'],
          queryFn: () => apiService.request('/organizations/?owned=true'),
          staleTime: 5 * 60 * 1000,
        });
      },
      '/profile': () => {
        queryClient.prefetchQuery({
          queryKey: ['/organizations/', 'owned'],
          queryFn: () => apiService.request('/organizations/?owned=true'),
          staleTime: 5 * 60 * 1000,
        });
      },
      '/jobs/create': () => {
        // Prefetch form data for job creation
        queryClient.prefetchQuery({
          queryKey: ['/categories/'],
          queryFn: () => apiService.request('/categories/'),
          staleTime: 15 * 60 * 1000,
        });
        queryClient.prefetchQuery({
          queryKey: ['/locations/'],
          queryFn: () => apiService.request('/locations/'),
          staleTime: 15 * 60 * 1000,
        });
      },
      '/settings': () => {
        // Settings page doesn't need much data, maybe user preferences in the future
      },
    };

    const prefetchFn = prefetchMap[route];
    if (prefetchFn) {
      console.log(`[Prefetch] Executing prefetch for: ${route}`);
      prefetchFn();
    } else {
      console.log(`[Prefetch] No prefetch function found for route: ${route}`);
    }
  }, [queryClient, selectedOrganization?.id]);

  return { prefetchRoute };
}