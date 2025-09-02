import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { ChatMessage, Room, PaginatedResponse } from "@/types";

interface ChatWindowProps {
  roomId: number;
}

export default function ChatWindow({ roomId }: ChatWindowProps) {
  const { t } = useTranslation();
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
    queryFn: () => apiService.request<PaginatedResponse<ChatMessage>>(`/chat/messages/?room=${roomId}`),
    enabled: !!roomId,
  });

  // Send message mutation with optimistic updates
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => apiService.request<ChatMessage>('/chat/messages/', {
      method: 'POST',
      body: JSON.stringify({
        room: roomId,
        content,
      }),
    }),
    onMutate: async (content) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/chat/messages/', roomId] });
      
      // Snapshot the previous messages
      const previousMessages = queryClient.getQueryData(['/chat/messages/', roomId]);
      
      // Create optimistic message
      const tempId = Date.now();
      const optimisticMessage = {
        id: tempId,
        room: roomId,
        content,
        owner: {
          id: 0, // Will be filled by server
          first_name: 'You',
          last_name: '',
        },
        date_created: new Date().toISOString(),
        isOptimistic: true
      };
      
      // Optimistically add the message
      queryClient.setQueryData(['/chat/messages/', roomId], (old: any) => {
        if (!old?.results) return { results: [optimisticMessage], count: 1 };
        return {
          ...old,
          results: [...old.results, optimisticMessage],
          count: old.count + 1
        };
      });
      
      // Clear input immediately
      setNewMessage("");
      
      return { previousMessages, tempId };
    },
    onError: (err, content, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['/chat/messages/', roomId], context.previousMessages);
      }
      // Restore the message in input
      setNewMessage(content);
    },
    onSuccess: (data, content, context) => {
      // Replace optimistic message with real data
      if (context?.tempId && data) {
        queryClient.setQueryData(['/chat/messages/', roomId], (old: any) => {
          if (!old?.results) return old;
          return {
            ...old,
            results: old.results.map((msg: any) => 
              msg.id === context.tempId ? data : msg
            )
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/chat/messages/', roomId] });
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
      <CardHeader className="border-b pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">
              {room?.name || `Chat Room #${roomId}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {room?.members?.length || 0} participants
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground mt-2">Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium">
                        {`${message.owner.first_name} ${message.owner.last_name}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.date_created), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Message input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t("forms.placeholders.typeMessage")}
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
