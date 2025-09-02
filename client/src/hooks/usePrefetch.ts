import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/lib/api';

// Smart background prefetching when user is idle - only fetch what's not already cached
function useIdlePrefetch(queryClient: any, selectedOrganization: any, currentPath: string) {
  useEffect(() => {
    if (!selectedOrganization?.id) return;
    
    let idleTimer: NodeJS.Timeout;
    
    const startIdlePrefetch = () => {
      // After 5 seconds of idle, start prefetching missing data only
      idleTimer = setTimeout(() => {
        const prefetchTasks: Promise<any>[] = [];
        
        // Only prefetch core notifications if not on current route
        if (currentPath !== '/notifications') {
          const notificationKey = ['/notifications/', selectedOrganization.id];
          const notificationCache = queryClient.getQueryData(notificationKey);
          if (!notificationCache) {
            prefetchTasks.push(
              queryClient.prefetchQuery({
                queryKey: notificationKey,
                queryFn: () => apiService.request(`/notifications/?organization=${selectedOrganization.id}`),
                staleTime: 5 * 60 * 1000,
              })
            );
          }
        }
        
        // Only execute if there are tasks to run
        if (prefetchTasks.length > 0) {
          Promise.allSettled(prefetchTasks).catch(() => {
            // Silently handle any prefetch errors
          });
        }
      }, 5000); // Increased delay to be less aggressive
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
  
  // Start smart background prefetching when idle
  useIdlePrefetch(queryClient, selectedOrganization, location.pathname);

  // Only prefetch reference data when actually needed
  const prefetchFormData = useCallback(() => {
    if (!selectedOrganization?.id) return;

    // Only prefetch if not already cached
    const categoriesKey = ['/categories/'];
    const locationsKey = ['/locations/'];
    
    if (!queryClient.getQueryData(categoriesKey)) {
      queryClient.prefetchQuery({
        queryKey: categoriesKey,
        queryFn: () => apiService.request('/categories/'),
        staleTime: 15 * 60 * 1000,
      });
    }

    if (!queryClient.getQueryData(locationsKey)) {
      queryClient.prefetchQuery({
        queryKey: locationsKey,
        queryFn: () => apiService.request('/locations/'),
        staleTime: 15 * 60 * 1000,
      });
    }
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

  // Prefetch applications data with correct key to match Applications page
  const prefetchApplications = useCallback(() => {
    if (!selectedOrganization?.id) return;

    // Use same key structure as Applications page to avoid duplicates
    const applicationsKey = ['/jobs/applications/', 'all', selectedOrganization.id];
    if (!queryClient.getQueryData(applicationsKey)) {
      queryClient.prefetchQuery({
        queryKey: applicationsKey,
        queryFn: () => apiService.request(`/jobs/applications/?organization=${selectedOrganization.id}`),
        staleTime: 2 * 60 * 1000,
      });
    }
  }, [queryClient, selectedOrganization?.id]);

  // Prefetch chat rooms only if not already cached
  const prefetchChatRooms = useCallback(() => {
    const roomsKey = ['/chat/rooms/'];
    if (!queryClient.getQueryData(roomsKey)) {
      queryClient.prefetchQuery({
        queryKey: roomsKey,
        queryFn: () => apiService.request('/chat/rooms/'),
        staleTime: 2 * 60 * 1000,
      });
    }
  }, [queryClient]);


  // Smart prefetching based on current route
  useEffect(() => {
    const currentPath = location.pathname;

    // Smart route-specific prefetching - only what's needed
    switch (currentPath) {
      case '/':
        // From Dashboard, likely to go to Jobs or Applications
        setTimeout(() => {
          prefetchJobs();
          prefetchApplications();
        }, 2000); // Delay to not interfere with current page load
        break;

      case '/jobs':
      case '/jobs/create':
        // From Jobs, prefetch form data and applications
        setTimeout(() => {
          prefetchFormData(); // Only for job creation
          prefetchApplications();
        }, 1500);
        break;

      case '/applications':
        // From Applications, only prefetch chat rooms (no form data needed)
        setTimeout(() => {
          prefetchChatRooms();
        }, 1500);
        break;

      case '/chat':
        // From Chat, likely to go back to Applications
        setTimeout(() => {
          prefetchApplications();
        }, 1500);
        break;

      default:
        // For other routes, minimal prefetching
        break;
    }
  }, [location.pathname, prefetchJobs, prefetchApplications, prefetchChatRooms, prefetchFormData]);

  // Return individual prefetch functions for manual triggering
  return {
    prefetchJobs,
    prefetchApplications,
    prefetchChatRooms,
    prefetchFormData,
  };
}

// Hook for prefetching specific route data on hover
export function useHoverPrefetch() {
  const queryClient = useQueryClient();
  const { selectedOrganization } = useAuth();

  const prefetchRoute = useCallback((route: string) => {
    if (!selectedOrganization?.id) return;
    

    const prefetchMap: Record<string, () => void> = {
      '/jobs': () => {
        const jobsKey = ['/jobs/', selectedOrganization.id];
        if (!queryClient.getQueryData(jobsKey)) {
          queryClient.prefetchQuery({
            queryKey: jobsKey,
            queryFn: () => apiService.request(`/jobs/?organization=${selectedOrganization.id}`),
            staleTime: 2 * 60 * 1000,
          });
        }
      },
      '/applications': () => {
        const applicationsKey = ['/jobs/applications/', 'all', selectedOrganization.id];
        if (!queryClient.getQueryData(applicationsKey)) {
          queryClient.prefetchQuery({
            queryKey: applicationsKey,
            queryFn: () => apiService.request(`/jobs/applications/?organization=${selectedOrganization.id}`),
            staleTime: 2 * 60 * 1000,
          });
        }
      },
      '/chat': () => {
        const roomsKey = ['/chat/rooms/'];
        if (!queryClient.getQueryData(roomsKey)) {
          queryClient.prefetchQuery({
            queryKey: roomsKey,
            queryFn: () => apiService.request('/chat/rooms/'),
            staleTime: 2 * 60 * 1000,
          });
        }
      },
      '/notifications': () => {
        const notificationsKey = ['/notifications/', selectedOrganization.id];
        if (!queryClient.getQueryData(notificationsKey)) {
          queryClient.prefetchQuery({
            queryKey: notificationsKey,
            queryFn: () => apiService.request(`/notifications/?organization=${selectedOrganization.id}`),
            staleTime: 5 * 60 * 1000,
          });
        }
      },
      '/organization': () => {
        const orgsKey = ['/organizations/', 'owned'];
        if (!queryClient.getQueryData(orgsKey)) {
          queryClient.prefetchQuery({
            queryKey: orgsKey,
            queryFn: () => apiService.request('/organizations/?owned=true'),
            staleTime: 5 * 60 * 1000,
          });
        }
      },
      '/profile': () => {
        const orgsKey = ['/organizations/', 'owned'];
        if (!queryClient.getQueryData(orgsKey)) {
          queryClient.prefetchQuery({
            queryKey: orgsKey,
            queryFn: () => apiService.request('/organizations/?owned=true'),
            staleTime: 5 * 60 * 1000,
          });
        }
      },
      '/jobs/create': () => {
        // Prefetch form data for job creation only if not cached
        const categoriesKey = ['/categories/'];
        const locationsKey = ['/locations/'];
        
        if (!queryClient.getQueryData(categoriesKey)) {
          queryClient.prefetchQuery({
            queryKey: categoriesKey,
            queryFn: () => apiService.request('/categories/'),
            staleTime: 15 * 60 * 1000,
          });
        }
        
        if (!queryClient.getQueryData(locationsKey)) {
          queryClient.prefetchQuery({
            queryKey: locationsKey,
            queryFn: () => apiService.request('/locations/'),
            staleTime: 15 * 60 * 1000,
          });
        }
      },
      '/settings': () => {
        // Settings page doesn't need much data, maybe user preferences in the future
      },
    };

    // Handle dynamic routes like /jobs/:id
    if (route.startsWith('/jobs/') && route !== '/jobs' && route !== '/jobs/create') {
      const jobId = route.split('/')[2];
      if (jobId && /^\d+$/.test(jobId)) {
        const jobKey = ['/jobs/', jobId, 'details'];
        if (!queryClient.getQueryData(jobKey)) {
          queryClient.prefetchQuery({
            queryKey: jobKey,
            queryFn: () => apiService.request(`/jobs/${jobId}/`),
            staleTime: 5 * 60 * 1000,
          });
        }
        
        // Also prefetch applications for this job (with error handling)
        queryClient.prefetchQuery({
          queryKey: ['/jobs/', jobId, 'applications'],
          queryFn: () => apiService.request(`/jobs/${jobId}/applications/`),
          staleTime: 2 * 60 * 1000, // 2 minutes
          retry: (failureCount, error: any) => {
            // Don't retry on 404 errors - endpoint might not exist for this job
            if (error?.status === 404) return false;
            return failureCount < 2;
          },
        }).catch(() => {
          // Silently handle prefetch errors - this is background loading
          console.log(`[Prefetch] Applications endpoint not available for job ${jobId}`);
        });
        return;
      }
    }

    // Handle dynamic routes like /applications/:id  
    if (route.startsWith('/applications/') && route !== '/applications') {
      const applicationId = route.split('/')[2];
      if (applicationId && /^\d+$/.test(applicationId)) {
        const appKey = ['/jobs/applications/', applicationId, 'details'];
        if (!queryClient.getQueryData(appKey)) {
          queryClient.prefetchQuery({
            queryKey: appKey,
            queryFn: () => apiService.request(`/jobs/applications/${applicationId}/`),
            staleTime: 5 * 60 * 1000,
          });
        }
        return;
      }
    }

    // Handle dynamic routes like /user/:id
    if (route.startsWith('/user/') && route !== '/user') {
      const userId = route.split('/')[2];
      if (userId && /^\d+$/.test(userId)) {
        const userKey = ['/users/', userId];
        if (!queryClient.getQueryData(userKey)) {
          queryClient.prefetchQuery({
            queryKey: userKey,
            queryFn: () => apiService.request(`/users/${userId}/`),
            staleTime: 5 * 60 * 1000,
          });
        }
        return;
      }
    }

    const prefetchFn = prefetchMap[route];
    if (prefetchFn) {
      prefetchFn();
    }
  }, [queryClient, selectedOrganization?.id]);

  return { prefetchRoute };
}