import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Message, Room, PaginatedResponse } from "@shared/schema";

interface ChatWindowProps {
  roomId: number;
}

export default function ChatWindow({ roomId }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch room details
  const { data: rooms } = useQuery({
    queryKey: ['/chat/rooms/'],
    queryFn: () => apiService.request<PaginatedResponse<Room>>('/chat/rooms/'),
  });

  const room = rooms?.results.find(r => r.id === roomId);

  // Fetch messages
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['/chat/messages/', roomId],
    queryFn: () => apiService.request<PaginatedResponse<Message>>(`/chat/messages/?room=${roomId}`),
    enabled: !!roomId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => apiService.request<Message>('/chat/messages/', {
      method: 'POST',
      body: JSON.stringify({
        room: roomId,
        content,
      }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/chat/messages/', roomId] });
      setNewMessage("");
    },
  });

  // WebSocket for real-time messages
  const { sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'chat_message' && data.room === roomId) {
        queryClient.invalidateQueries({ queryKey: ['/chat/messages/', roomId] });
      }
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    sendMessageMutation.mutate(newMessage);
    
    // Also send via WebSocket for real-time updates
    sendMessage({
      type: 'chat_message',
      room: roomId,
      content: newMessage,
    });
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.results]);

  const messages = messagesData?.results || [];

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              {room?.name || `Chat Room #${roomId}`}
            </h3>
            <p className="text-sm text-gray-500">
              {room?.participants.length || 0} participants
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400 mt-2">Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {message.sender_name || `User #${message.sender}`}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{message.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Message input */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            <Button 
              type="submit" 
              size="sm"
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
