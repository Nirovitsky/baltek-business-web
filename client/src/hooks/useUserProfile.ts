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

  // Helper function to find existing chat room with user
  const findExistingRoom = (targetUserId: number) => {
    if (!roomsData?.results) {
      console.log('❌ No rooms data available for search');
      return null;
    }
    
    console.log('🔍 Searching for rooms with user ID:', targetUserId);
    console.log('📋 Available rooms:', roomsData.results.map(r => ({
      id: r.id,
      participants: r.participants || r.members || [],
      content_object: r.content_object?.owner?.id
    })));
    
    const existingRoom = roomsData.results.find((room: Room) => {
      // Check both participants and members fields
      const roomMembers = room.participants || room.members || [];
      
      // Also check if this room is for this specific user via content_object
      const isForThisUser = room.content_object?.owner?.id === targetUserId;
      
      // Check if user is in participants/members
      const isParticipant = roomMembers.some((member: any) => {
        const memberId = typeof member === 'object' ? member.id : member;
        return memberId === targetUserId;
      });
      
      console.log(`🏠 Room ${room.id}: isForThisUser=${isForThisUser}, isParticipant=${isParticipant}`);
      
      return isForThisUser || isParticipant;
    });
    
    if (existingRoom) {
      console.log('✅ Found existing room:', existingRoom.id);
    } else {
      console.log('❌ No existing room found for user:', targetUserId);
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