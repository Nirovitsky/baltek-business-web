import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import type { User, ChatRoom, ChatMessage, PaginatedResponse } from "@/types";

// Chat rooms hook
export function useChatRooms() {
  return useQuery({
    queryKey: ['/chat/rooms/'],
    queryFn: () => apiService.request<PaginatedResponse<ChatRoom>>('/chat/rooms/'),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Chat messages hook  
export function useChatMessages(roomId?: number) {
  return useQuery({
    queryKey: ['/chat/messages/', roomId],
    queryFn: () => apiService.request<PaginatedResponse<ChatMessage>>(`/chat/messages/?room=${roomId}`),
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
      console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const formData = new FormData();
      formData.append('file', file);
      
      // Debug FormData content
      console.log('FormData entries:', Array.from(formData.entries()).map(([key, value]) => [
        key, 
        value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value
      ]));
      
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
          console.log('Upload response status:', xhr.status);
          console.log('Upload response:', xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (error) {
              console.error('Failed to parse response:', xhr.responseText);
              reject(new Error('Invalid response format'));
            }
          } else {
            console.error('Upload failed:', xhr.status, xhr.responseText);
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