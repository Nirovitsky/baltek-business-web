import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import type { User, ChatRoom, ChatMessage, PaginatedResponse } from "@/types";

// Chat rooms hook with optional organization filtering
export function useChatRooms(organizationId?: number) {
  return useQuery({
    queryKey: ['/chat/rooms/'],  // Use consistent cache key
    queryFn: () => apiService.request<PaginatedResponse<ChatRoom>>('/chat/rooms/'),
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    select: (data) => {
      if (!organizationId) return data;
      
      // Filter rooms to only show ones for the specified organization
      const filteredResults = data.results.filter((room: ChatRoom) => 
        room.content_object?.job?.organization?.id === organizationId
      );
      
      return {
        ...data,
        results: filteredResults,
        count: filteredResults.length
      };
    }
  });
}

// Chat messages hook  
export function useChatMessages(roomId?: number) {
  return useQuery({
    queryKey: ['/chat/messages/', roomId],
    queryFn: () => apiService.request<PaginatedResponse<ChatMessage>>(`/chat/messages/?room=${roomId}`),
    enabled: !!roomId,
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });
}

// File upload hook with progress tracking
export function useUploadFile() {
  const queryClient = useQueryClient();
  
  return {
    uploadFile: (file: File, onProgress?: (progress: number) => void): { promise: Promise<any>, abort: () => void } => {
      
      const formData = new FormData();
      formData.append('path', file);
      
      
      const controller = new AbortController();
      
      const promise = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });
        
        xhr.addEventListener('load', () => {
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred'));
        });
        
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });
        
        // Get auth token for the request
        const token = localStorage.getItem('access_token');
        
        xhr.open('POST', 'https://api.baltek.net/api/files/', true);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.send(formData);
        
        // Handle abort signal
        controller.signal.addEventListener('abort', () => {
          xhr.abort();
        });
      });
      
      return {
        promise,
        abort: () => controller.abort()
      };
    }
  };
}

// Mark conversation as read mutation (placeholder for future API support)
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversationId: number) => {
      // This would be implemented when the API supports read receipts
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      // Don't refetch rooms, just mark as read locally if needed
    },
    onError: (error) => {
      console.error("Mark as read error:", error);
      // Silent error - don't show toast for this
    },
  });
}