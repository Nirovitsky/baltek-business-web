import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { User, Room, PaginatedResponse } from '@/types';

export function useUserProfile(userId?: string, options?: { fetchRooms?: boolean }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { fetchRooms = true } = options || {};

  // Fetch user profile data
  const {
    data: userProfile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users/', userId],
    queryFn: () => apiService.request<User>(`users/${userId}/`),
    enabled: !!userId,
  });

  // Use shared rooms query with same key as other components to avoid duplication
  // Only fetch rooms when explicitly needed
  const { data: roomsData } = useQuery({
    queryKey: ["/chat/rooms/"],
    queryFn: () => apiService.request<PaginatedResponse<Room>>('/chat/rooms/'),
    staleTime: 2 * 60 * 1000, // Keep data fresh for 2 minutes
    enabled: fetchRooms,
  });

  // Create chat room mutation using the correct application-specific endpoint
  const createChatMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      // Use the application-specific create room endpoint
      const roomData = await apiService.request<Room>(`/jobs/applications/${applicationId}/create_room/`, {
        method: 'POST',
      });
      
      return roomData;
    },
    onSuccess: (roomData: any) => {
      // Invalidate rooms query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/chat/rooms/'] });
      toast({
        title: 'Success',
        description: 'Chat room created successfully',
      });
      return roomData;
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create chat room',
        variant: 'destructive',
      });
    },
  });

  // Helper function to find existing chat room with user and specific application/job
  const findExistingRoom = (targetUserId: number, applicationId?: number) => {
    if (!roomsData?.results) {
      console.log('❌ No rooms data available for search');
      return null;
    }
    
    console.log('🔍 Searching for rooms with user ID:', targetUserId, 'and application ID:', applicationId);
    console.log('📋 Available rooms:', roomsData.results.map(r => ({
      id: r.id,
      participants: r.participants || r.members || [],
      content_object: {
        owner_id: (r as any).content_object?.owner?.id,
        application_id: (r as any).content_object?.id,
        job_id: (r as any).content_object?.job?.id
      }
    })));
    
    const existingRoom = roomsData.results.find((room: Room) => {
      const roomData = room as any;
      // Check if this room is for this specific user via content_object
      const isForThisUser = roomData.content_object?.owner?.id === targetUserId;
      
      // If we have an application ID, also check if it's for the same application
      let isForSameApplication = true;
      if (applicationId && roomData.content_object?.id) {
        isForSameApplication = roomData.content_object.id === applicationId;
      }
      
      console.log(`🏠 Room ${room.id}: isForThisUser=${isForThisUser}, isForSameApplication=${isForSameApplication}, applicationId=${roomData.content_object?.id}`);
      
      return isForThisUser && isForSameApplication;
    });
    
    if (existingRoom) {
      console.log('✅ Found existing room:', existingRoom.id, 'for application:', (existingRoom as any).content_object?.id);
    } else {
      console.log('❌ No existing room found for user:', targetUserId, 'and application:', applicationId);
    }
    
    return existingRoom;
  };

  return {
    userProfile,
    isLoading,
    error,
    rooms: roomsData?.results || [],
    roomsData,
    createChatMutation,
    findExistingRoom,
  };
}