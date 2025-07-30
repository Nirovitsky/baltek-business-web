import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, Search, Phone, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocketChat } from "@/hooks/useWebSocketChat";
import { apiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Room, Message, PaginatedResponse } from "@shared/schema";

export default function Messages() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    connected,
    messages: wsMessages,
    currentRoom,
    sendMessage,
    joinRoom,
  } = useWebSocketChat();

  // Fetch chat rooms
  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ["/chat/rooms/"],
    queryFn: () => apiService.request<PaginatedResponse<Room>>("/chat/rooms/"),
  });

  // Fetch messages for selected room
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["/chat/messages/", selectedRoom?.id],
    queryFn: () => {
      if (!selectedRoom) return null;
      return apiService.request<PaginatedResponse<Message>>(
        `/chat/messages/?room=${selectedRoom.id}`,
      );
    },
    enabled: !!selectedRoom,
  });

  const rooms = roomsData?.results || [];
  const apiMessages = messagesData?.results || [];

  // Combine API messages with WebSocket messages for current room
  const allMessages =
    selectedRoom?.id === currentRoom
      ? [...apiMessages, ...wsMessages]
      : apiMessages;

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRoom) return;

    const success = sendMessage(selectedRoom.id, newMessage);
    if (success) {
      setNewMessage("");
    } else {
      toast({
        title: "Error",
        description: "Failed to send message. Please check your connection.",
        variant: "destructive",
      });
    }
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    joinRoom(room.id);
  };

  const filteredRooms = rooms.filter((room) => {
    const participantNames = room.members
      .filter((p) => p.id.toString() !== user?.id)
      .map((p) => `${p.first_name} ${p.last_name}`)
      .join(" ");

    return participantNames.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getRoomDisplayName = (room: Room) => {
    if (room.name) return room.name;

    // Find the other participant (not the current user)
    const otherParticipant = room.members.find(
      (p) => p.id.toString() !== user?.id,
    );
    return otherParticipant
      ? `${otherParticipant.first_name} ${otherParticipant.last_name}`
      : "Unknown User";
  };

  const getRoomAvatar = (room: Room) => {
    const otherParticipant = room.members.find(
      (p) => p.id.toString() !== user?.id,
    );
    return otherParticipant
      ? `${otherParticipant.first_name[0]}${otherParticipant.last_name[0]}`
      : "U";
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  // Auto-select first room if none selected
  useEffect(() => {
    if (!selectedRoom && rooms.length > 0) {
      handleRoomSelect(rooms[0]);
    }
  }, [rooms, selectedRoom]);

  if (roomsLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No conversations yet
          </h2>
          <p className="text-gray-500">
            Conversations will appear here when you start chatting with
            candidates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
              />
              <span className="text-xs text-gray-500">
                {connected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => handleRoomSelect(room)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedRoom?.id === room.id ? "bg-blue-50 border-blue-200" : ""
              }`}
            >
              <div className="flex items-start space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {getRoomAvatar(room)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getRoomDisplayName(room)}
                    </p>
                    <span className="text-xs text-gray-500">
                      {room.last_message_text
                        ? new Date(
                            room.last_message_date_created ?? "",
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {room.last_message_text || "No messages yet"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {getRoomAvatar(selectedRoom)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {getRoomDisplayName(selectedRoom)}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedRoom.members.length} participant
                      {selectedRoom.members.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {selectedRoom.members
                    .filter((p) => p.id.toString() !== user?.id)
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center space-x-1 text-sm text-gray-500"
                      ></div>
                    ))}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Loading messages...</p>
                </div>
              ) : allMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                </div>
              ) : (
                allMessages.map((message) => {
                  const isOwn = message.owner.id.toString() === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                        {!isOwn && (
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                              {message.owner.first_name}
                              {message.owner.last_name}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isOwn
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-900"
                          }`}
                        >
                          {!isOwn && (
                            <p className="text-xs font-medium mb-1 text-gray-600">
                              {message.owner.first_name}{" "}
                              {message.owner.last_name}
                            </p>
                          )}
                          <p className="text-sm">{message.text}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {new Date(message.date_created).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex space-x-4">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                  disabled={!connected}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !connected}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {!connected && (
                <p className="text-xs text-red-500 mt-2">
                  Disconnected from chat server. Trying to reconnect...
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Select a conversation
              </h2>
              <p className="text-gray-500">
                Choose a conversation from the sidebar to start chatting.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
