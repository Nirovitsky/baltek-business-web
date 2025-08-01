import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, Search, Phone, User, Paperclip, Image, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocketGlobal } from "@/hooks/useWebSocketGlobal";
import { apiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import FileUpload from "@/components/chat/FileUpload";
import AttachmentPreview from "@/components/chat/AttachmentPreview";
import type { Room, Message, PaginatedResponse } from "@shared/schema";

export default function Messages() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check URL parameters for new chat requests - removed since we handle this in UserProfile now

  const {
    connected,
    messages: wsMessages,
    currentRoom,
    sendMessage,
    joinRoom,
  } = useWebSocketGlobal();

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

  // Auto-select room from URL hash
  useEffect(() => {
    const roomHash = window.location.hash;
    if (roomHash.startsWith('#room-') && rooms.length > 0) {
      const roomId = parseInt(roomHash.replace('#room-', ''));
      const targetRoom = rooms.find(r => r.id === roomId);
      if (targetRoom && (!selectedRoom || selectedRoom.id !== roomId)) {
        handleRoomSelect(targetRoom);
        // Clear hash after selection
        window.history.replaceState({}, '', '/messages');
      }
    }
  }, [rooms, selectedRoom]);

  // Helper function to parse European date format
  const parseDate = (dateString: string): Date => {
    if (typeof dateString === 'string' && dateString.includes('.') && dateString.includes(' ')) {
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('.');
      // Convert to ISO format: YYYY-MM-DDTHH:mm:ss
      const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`;
      return new Date(isoString);
    }
    return new Date(dateString);
  };

  // Combine API messages with WebSocket messages, removing duplicates
  const allMessages = selectedRoom?.id === currentRoom
    ? (() => {
        const combined = [...apiMessages];
        wsMessages.forEach(wsMsg => {
          if (!combined.some(apiMsg => apiMsg.id === wsMsg.id)) {
            combined.push(wsMsg);
          }
        });
        return combined.sort((a, b) => {
          const dateA = parseDate(a.date_created).getTime();
          const dateB = parseDate(b.date_created).getTime();
          return dateA - dateB;
        });
      })()
    : [...apiMessages].sort((a, b) => {
        const dateA = parseDate(a.date_created).getTime();
        const dateB = parseDate(b.date_created).getTime();
        return dateA - dateB;
      });

  // File upload mutation
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      // Simulate upload progress with more realistic intervals
      setUploadProgress(0);
      
      // Simulate upload chunks
      const chunks = [0, 15, 35, 60, 80, 100];
      for (const progress of chunks) {
        setUploadProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Simulate final processing
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // For now, simulate the upload since we don't have actual file storage
      return {
        url: `https://example.com/files/${Date.now()}-${file.name}`,
        name: file.name,
        type: file.type,
        size: file.size,
      };
    },
  });

  const handleSendMessage = () => {
    if (!selectedRoom || (!newMessage.trim() && !selectedFile)) return;

    if (selectedFile) {
      // Send file
      uploadFileMutation.mutate(selectedFile, {
        onSuccess: (uploadResult) => {
          // Send message with attachment
          const success = sendMessage(selectedRoom.id, newMessage || '', uploadResult);
          if (success) {
            setNewMessage("");
            setSelectedFile(null);
            setShowFileUpload(false);
            setUploadProgress(0);
            // WebSocket will handle adding the message to the list
          } else {
            toast({
              title: "Error",
              description: "Failed to send message with attachment.",
              variant: "destructive",
            });
          }
        },
        onError: () => {
          toast({
            title: "Upload failed",
            description: "Failed to upload file. Please try again.",
            variant: "destructive",
          });
          setUploadProgress(0);
        },
      });
    } else {
      // Send text message
      const success = sendMessage(selectedRoom.id, newMessage);
      if (success) {
        setNewMessage("");
        // WebSocket will handle adding the message to the list
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please check your connection.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleRoomSelect = (room: Room) => {
    // Prevent selecting the same room multiple times
    if (selectedRoom?.id === room.id) {
      return;
    }
    
    setSelectedRoom(room);
    joinRoom(room.id);
    // Invalidate messages query to refresh
    queryClient.invalidateQueries({ queryKey: ["/chat/messages/", room.id] });
  };

  // Store user data for room members (we'll need to fetch this separately)
  const [roomMemberData, setRoomMemberData] = useState<Record<number, {id: number, first_name: string, last_name: string}>>({});

  // Fetch user data for room members
  useEffect(() => {
    const fetchMemberData = async () => {
      const allMemberIds = new Set<number>();
      
      console.log('=== FETCH MEMBER DATA DEBUG ===');
      console.log('Total rooms:', rooms.length);
      console.log('Current user ID:', user?.id);
      
      rooms.forEach(room => {
        console.log(`Room ${room.id}:`, {
          members: room.members,
          membersType: typeof room.members,
          isArray: Array.isArray(room.members)
        });
        
        if (Array.isArray(room.members)) {
          room.members.forEach((memberId, index) => {
            console.log(`  Member ${index}:`, memberId, typeof memberId);
            // Ensure memberId is properly handled as a number
            const numericMemberId = typeof memberId === 'number' ? memberId : parseInt(String(memberId));
            console.log(`  Numeric conversion:`, numericMemberId, !isNaN(numericMemberId), numericMemberId !== user?.id);
            if (!isNaN(numericMemberId) && numericMemberId !== user?.id) {
              allMemberIds.add(numericMemberId);
            }
          });
        }
      });
      
      console.log('All member IDs to fetch:', Array.from(allMemberIds));

      // Fetch user data for each unique member (only if we don't already have it)
      const memberDataPromises = Array.from(allMemberIds)
        .filter(userId => !roomMemberData[userId]) // Only fetch if we don't have the data
        .map(async (userId) => {
        
        try {
          // Ensure userId is a number when making the request
          const numericUserId = typeof userId === 'number' ? userId : parseInt(String(userId));
          
          // Add validation to prevent [object Object] issue
          if (isNaN(numericUserId) || numericUserId <= 0) {
            console.error('Invalid userId detected:', userId, 'numericUserId:', numericUserId);
            return;
          }
          

          const userData = await apiService.request<any>(`/users/${numericUserId}/`);
          setRoomMemberData(prev => ({
            ...prev,
            [numericUserId]: {
              id: userData.id,
              first_name: userData.first_name || 'Unknown',
              last_name: userData.last_name || 'User'
            }
          }));
        } catch (error) {
          console.error(`Failed to fetch user data for ${userId}:`, error);
          const numericUserId = typeof userId === 'number' ? userId : parseInt(String(userId));
          if (!isNaN(numericUserId) && numericUserId > 0) {
            setRoomMemberData(prev => ({
              ...prev,
              [numericUserId]: {
                id: numericUserId,
                first_name: 'Unknown',
                last_name: 'User'
              }
            }));
          }
        }
      });

      await Promise.all(memberDataPromises);
    };

    if (rooms.length > 0 && user?.id) {
      fetchMemberData();
    }
  }, [rooms, user?.id]); // Removed roomMemberData dependency to prevent loop

  const filteredRooms = rooms.filter((room) => {
    const participantNames = room.members
      .filter((memberId) => {
        // Ensure memberId is treated as a number
        const numericMemberId = typeof memberId === 'number' ? memberId : parseInt(String(memberId));
        return !isNaN(numericMemberId) && numericMemberId !== user?.id;
      })
      .map((memberId) => {
        const numericMemberId = typeof memberId === 'number' ? memberId : parseInt(String(memberId));
        const memberData = roomMemberData[numericMemberId];
        return memberData ? `${memberData.first_name} ${memberData.last_name}` : `User ${numericMemberId}`;
      })
      .join(" ");

    return participantNames.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getRoomDisplayName = (room: Room) => {
    if (room.name) return room.name;

    // If this is a 1-on-1 chat and we only have the current user, show their name
    if (room.members.length === 1 && user) {
      return `${user.first_name} ${user.last_name}`;
    }

    // Find the other participant ID (not the current user)
    const otherParticipantId = getOtherParticipantId(room);
    
    if (otherParticipantId) {
      const memberData = roomMemberData[otherParticipantId];
      if (memberData) {
        return `${memberData.first_name} ${memberData.last_name}`;
      }
      // If we don't have member data yet, show loading state
      return `Loading user ${otherParticipantId}...`;
    }
    
    // Fallback: show the room ID or participant count
    return room.members.length > 1 ? `Chat Room ${room.id}` : "Chat Room";
  };

  // Helper function to get the other participant's numeric ID
  const getOtherParticipantId = (room: Room): number | null => {
    if (!room.members || room.members.length === 0) {
      console.log('Room has no members:', room.id);
      return null;
    }
    
    console.log('getOtherParticipantId - Room:', room.id, 'Members:', room.members, 'User ID:', user?.id);
    
    const otherMemberId = room.members.find(memberId => {
      const numericMemberId = typeof memberId === 'number' ? memberId : parseInt(String(memberId));
      const isValid = !isNaN(numericMemberId) && numericMemberId !== user?.id;
      console.log('  Checking member:', memberId, '→', numericMemberId, 'valid:', isValid);
      return isValid;
    });
    
    if (otherMemberId !== undefined) {
      const numericId = typeof otherMemberId === 'number' ? otherMemberId : parseInt(String(otherMemberId));
      if (!isNaN(numericId)) {
        console.log('  → Returning participant ID:', numericId);
        return numericId;
      }
    }
    
    console.log('  → No valid participant found');
    return null;
  };

  const getRoomAvatar = (room: Room) => {
    // If this is a 1-on-1 chat and we only have the current user, show their initials
    if (room.members.length === 1 && user) {
      const firstInitial = user.first_name?.[0]?.toUpperCase() || '';
      const lastInitial = user.last_name?.[0]?.toUpperCase() || '';
      return firstInitial + lastInitial || 'U';
    }

    const otherParticipantId = getOtherParticipantId(room);
    
    if (otherParticipantId) {
      const memberData = roomMemberData[otherParticipantId];
      if (memberData) {
        const firstInitial = memberData.first_name[0]?.toUpperCase() || '';
        const lastInitial = memberData.last_name[0]?.toUpperCase() || '';
        return firstInitial + lastInitial;
      }
      // Show numeric ID as fallback while loading
      return `${otherParticipantId}`;
    }
    
    // Fallback avatar
    return room.id ? `${room.id}` : "??";
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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className="w-1/3 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full shadow-sm">
              <div
                className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
              />
              <span className={`text-xs font-medium ${connected ? "text-green-600" : "text-red-600"}`}>
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
              className="pl-10 bg-white shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => handleRoomSelect(room)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                selectedRoom?.id === room.id ? "bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 shadow-md" : ""
              }`}
            >
              <div className="flex items-start space-x-3">
                {(() => {
                  const participantId = getOtherParticipantId(room);
                  if (participantId) {
                    return (
                      <Link href={`/profile/${participantId}`}>
                        <Avatar className="w-10 h-10 shadow-md cursor-pointer hover:shadow-lg transition-shadow">
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-semibold">
                            {getRoomAvatar(room)}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                    );
                  } else {
                    return (
                      <Avatar className="w-10 h-10 shadow-md cursor-not-allowed opacity-50">
                        <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-500 text-white font-semibold">
                          {getRoomAvatar(room)}
                        </AvatarFallback>
                      </Avatar>
                    );
                  }
                })()}
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
            <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const participantId = getOtherParticipantId(selectedRoom);
                    if (participantId) {
                      return (
                        <Link href={`/profile/${participantId}`}>
                          <Avatar className="w-10 h-10 shadow-md cursor-pointer hover:shadow-lg transition-shadow">
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-semibold">
                              {getRoomAvatar(selectedRoom)}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                      );
                    } else {
                      return (
                        <Avatar className="w-10 h-10 shadow-md cursor-not-allowed opacity-50">
                          <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-500 text-white font-semibold">
                            {getRoomAvatar(selectedRoom)}
                          </AvatarFallback>
                        </Avatar>
                      );
                    }
                  })()}
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
                    .filter((memberId) => memberId !== user?.id)
                    .map((memberId) => (
                      <div
                        key={memberId}
                        className="flex items-center space-x-1 text-sm text-gray-500"
                      ></div>
                    ))}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white/50">
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
                  const isOwn = message.owner.id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                        {!isOwn && (
                          <Link href={`/profile/${message.owner.id}`}>
                            <Avatar className="w-6 h-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                              <AvatarFallback className="bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 text-xs font-medium">
                                {message.owner.first_name[0]}{message.owner.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                        )}
                        <div
                          className={`px-4 py-2 rounded-lg shadow-sm ${
                            isOwn
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                              : "bg-white border border-gray-200 text-gray-900"
                          }`}
                        >

                          
                          {/* Show attachment if present */}
                          {message.attachment_url && (
                            <div className="mb-2">
                              <AttachmentPreview
                                attachment={{
                                  url: message.attachment_url,
                                  name: message.attachment_name || 'Attachment',
                                  type: message.attachment_type || 'file',
                                  size: message.attachment_size || 0,
                                }}
                              />
                            </div>
                          )}
                          
                          {/* Show text if present */}
                          {message.text && (
                            <p className="text-sm">{message.text}</p>
                          )}
                          <p className={`text-xs mt-1 ${
                              isOwn ? "text-blue-100" : "text-gray-500"
                            }`}>
                            {(() => {
                              // Use the same parsing function for consistency
                              const messageDate = parseDate(message.date_created);

                              // If date is still invalid, use message ID as fallback timestamp
                              if (isNaN(messageDate.getTime())) {
                                console.error('Invalid date, using fallback:', message.date_created);
                                return `Message #${message.id}`;
                              }

                              const today = new Date();
                              const yesterday = new Date(today);
                              yesterday.setDate(yesterday.getDate() - 1);

                              if (messageDate.toDateString() === today.toDateString()) {
                                return messageDate.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                });
                              } else if (messageDate.toDateString() === yesterday.toDateString()) {
                                return `Yesterday ${messageDate.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                })}`;
                              } else {
                                return `${messageDate.toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                  year: messageDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
                                })} ${messageDate.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                })}`;
                              }
                            })()}
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
            <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
              {/* File upload area */}
              {selectedFile && (
                <div className="mb-3">
                  <AttachmentPreview
                    attachment={{
                      url: URL.createObjectURL(selectedFile),
                      name: selectedFile.name,
                      type: selectedFile.type,
                      size: selectedFile.size,
                    }}
                    onRemove={handleRemoveFile}
                    showRemove={true}
                  />
                  {uploadFileMutation.isPending && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-200" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-2">
                <div className="flex space-x-1">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={!connected}
                    className="h-10 px-3 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                    title="Attach file"
                  >
                    <Paperclip className="w-4 h-4 mr-1" />
                    <span className="text-xs">File</span>
                  </Button>
                </div>
                
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={!connected}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={(!newMessage.trim() && !selectedFile) || !connected || uploadFileMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md"
                >
                  {uploadFileMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {!connected && (
                <div className="flex items-center space-x-2 mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-red-600 font-medium">
                    Disconnected from chat server. Trying to reconnect...
                  </p>
                </div>
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
