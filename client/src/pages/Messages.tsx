import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/TopBar";
import ChatWindow from "@/components/chat/ChatWindow";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiService } from "@/lib/api";
import { MessageCircle, User } from "lucide-react";
import type { Room, PaginatedResponse } from "@shared/schema";

export default function Messages() {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['/chat/rooms/'],
    queryFn: () => apiService.request<PaginatedResponse<Room>>('/chat/rooms/'),
  });

  const rooms = data?.results || [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar 
        title="Messages"
        description="Chat with job applicants"
        showCreateButton={false}
      />

      <main className="flex-1 overflow-hidden p-6">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Rooms List */}
          <Card className="lg:col-span-1">
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Chat Rooms</h3>
              </div>
              
              <div className="h-[500px] overflow-y-auto custom-scrollbar">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center space-x-3 p-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">No chat rooms yet</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Chat rooms will appear when you communicate with applicants
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {rooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        className={`w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors text-left ${
                          selectedRoomId === room.id ? 'bg-primary/10 border-r-4 border-primary' : ''
                        }`}
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {room.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {room.last_message || 'No messages yet'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {room.participants.length} participants
                          </p>
                        </div>
                        {room.unread_count && room.unread_count > 0 && (
                          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              {room.unread_count}
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Window */}
          <div className="lg:col-span-2">
            {selectedRoomId ? (
              <ChatWindow roomId={selectedRoomId} />
            ) : (
              <Card className="h-[600px]">
                <CardContent className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Select a chat room
                    </h3>
                    <p className="text-gray-500">
                      Choose a conversation from the list to start messaging
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
