import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, ChatRoom, ChatMessage } from "@/types";

// Chat rooms hook
export function useChatRooms() {
  return useQuery({
    queryKey: ['/api/chat/rooms/'],
    queryFn: async () => {
      const response = await apiRequest('GET', 'https://api.baltek.net/api/chat/rooms/');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Chat messages hook
export function useChatMessages(roomId?: number) {
  return useQuery({
    queryKey: ['/api/chat/messages/', roomId],
    queryFn: async () => {
      const response = await apiRequest('GET', `https://api.baltek.net/api/chat/messages/?room=${roomId}`);
      return response.json();
    },
    enabled: !!roomId,
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
      formData.append('file', file);
      
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
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred'));
        });
        
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });
        
        // Get auth token for the request - using the same token key as the app
        const token = localStorage.getItem('baltek_access_token');
        
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