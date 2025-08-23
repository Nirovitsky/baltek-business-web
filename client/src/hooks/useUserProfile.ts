import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { User, Room, PaginatedResponse } from '@/types';

export function useUserProfile(userId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
  const { data: roomsData } = useQuery({
    queryKey: ["/chat/rooms/"],
    queryFn: () => apiService.request<PaginatedResponse<Room>>('/chat/rooms/'),
    staleTime: 2 * 60 * 1000, // Keep data fresh for 2 minutes
  });

  // Create chat room mutation - using message creation to auto-create rooms
  const createChatMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      // Send an initial message which will auto-create the room
      const initialMessage = await apiService.request<any>('/chat/messages/', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Chat started',
          recipient: targetUserId,
        }),
      });
      
      // Return the room data from the message response
      return initialMessage.room || { id: initialMessage.room_id };
    },
    onSuccess: (roomData: any) => {
      // Invalidate rooms query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/chat/rooms/'] });
      toast({
        title: 'Success',
        description: 'Chat started successfully',
      });
      return roomData;
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start chat',
        variant: 'destructive',
      });
    },
  });

  // Helper function to find existing chat room with user
  const findExistingRoom = (targetUserId: number) => {
    if (!roomsData?.results) return null;
    
    return roomsData.results.find((room: Room) => {
      if (!room.members) return false;
      return room.members.some((member: any) => {
        const memberId = typeof member === 'object' ? member.id : member;
        return memberId === targetUserId;
      });
    });
  };

  return {
    userProfile,
    isLoading,
    error,
    rooms: roomsData?.results || [],
    createChatMutation,
    findExistingRoom,
  };
}