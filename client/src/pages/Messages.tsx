import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TopBar from "@/components/layout/TopBar";
import MessageRenderer from "@/components/MessageRenderer";
import { useChatRooms, useChatMessages, useUploadFile } from "@/hooks/useChatHooks";
import { useWebSocketGlobal } from "@/hooks/useWebSocketGlobal";
import FileUpload from "@/components/chat/FileUpload";
import {
  ComposerAddAttachment,
  ComposerAttachments,
  UploadProgress,
} from "@/components/AttachmentsUI";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  MessageCircle, 
  Send, 
  Search, 
  User, 
  Loader2,
  Paperclip 
} from "lucide-react";
import type { ChatMessage, ChatRoom, MessageAttachment } from "@/types";

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // WebSocket connection for real-time messaging
  const {
    connected,
    messages: wsMessages,
    currentRoom,
    sendMessage,
    joinRoom,
  } = useWebSocketGlobal();

  // Fetch chat rooms using correct endpoint
  const {
    data: chatRooms,
    isLoading: roomsLoading,
    error: roomsError,
  } = useChatRooms();

  // Fetch messages for selected room using correct endpoint
  const {
    data: messages,
    isLoading: messagesLoading,
    error: messagesError,
  } = useChatMessages(selectedConversation || undefined);

  // File upload hook
  const { uploadFile } = useUploadFile();

  // Get selected conversation data
  const selectedConversationData = chatRooms?.results?.find(
    (room: ChatRoom) => room.id === selectedConversation
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (timestamp: number | string | null) => {
    if (!timestamp) return '';
    
    try {
      let date: Date;
      
      // Handle Unix timestamp (number or string number)
      if (typeof timestamp === 'number') {
        date = new Date(timestamp * 1000); // Convert from seconds to milliseconds
      } else if (typeof timestamp === 'string' && /^\d+$/.test(timestamp)) {
        date = new Date(parseInt(timestamp) * 1000);
      } else if (typeof timestamp === 'string') {
        // Fallback for ISO strings or other formats
        date = new Date(timestamp);
      } else {
        return '';
      }
      
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      // Always show time for messages from today (including future timestamps)
      if (Math.abs(diffInDays) <= 0) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } else if (diffInDays === 1) {
        return "Yesterday";
      } else if (diffInDays < 7 && diffInDays > 0) {
        return date.toLocaleDateString([], { weekday: "short" });
      } else {
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
      }
    } catch (error) {
      console.error('Messages formatTime error:', error, timestamp);
      return '';
    }
  };

  // Handle sending messages
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !selectedFile) || !selectedConversation) return;

    setSendingMessage(true);
    
    try {
      let attachmentId: number | undefined;
      
      // Upload file first if there is one
      if (selectedFile) {
        setUploadingFile(true);
        setUploadProgress(0);
        
        const upload = uploadFile(selectedFile, (progress) => {
          setUploadProgress(progress);
        });
        
        try {
          const result = await upload.promise;
          attachmentId = result.id;
          setUploadProgress(100);
        } catch (uploadError) {
          console.error("File upload failed:", uploadError);
          toast({
            title: "File upload failed",
            description: "Could not upload your file. Please try again.",
            variant: "destructive",
          });
          throw uploadError; // Re-throw to prevent message sending
        } finally {
          setUploadingFile(false);
          setUploadProgress(0);
        }
      }
      
      // Send message via WebSocket
      const success = sendMessage(
        selectedConversation, 
        messageInput.trim(), 
        attachmentId ? [attachmentId] : undefined
      );
      
      if (success) {
        setMessageInput("");
        setSelectedFile(null);
        setTimeout(scrollToBottom, 100);
      } else {
        toast({
          title: "Failed to send message",
          description: "Please check your connection and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Failed to send message",
        description: "An error occurred while sending your message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  // Handle room selection
  const handleRoomSelect = (room: ChatRoom) => {
    setSelectedConversation(room.id);
    setMessageInput("");
    setSelectedFile(null);
    
    // Join room via WebSocket
    joinRoom(room.id);
    
    // Refresh messages for this room
    queryClient.invalidateQueries({ queryKey: ['/api/chat/messages/', room.id] });
  };

  // Auto scroll when messages change (with slight delay to ensure DOM updates)
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, wsMessages, selectedConversation]);

  // Combine API messages with WebSocket messages and sort by date
  const allMessages = selectedConversation === currentRoom 
    ? [...(messages?.results || []), ...wsMessages].sort((a, b) => a.date_created - b.date_created)
    : (messages?.results || []).sort((a, b) => a.date_created - b.date_created);

  const filteredRooms = chatRooms?.results?.filter((room: ChatRoom) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      room.content_object?.title?.toLowerCase().includes(query) ||
      room.last_message_text?.toLowerCase().includes(query)
    );
  }) || [];

  if (roomsLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          title="Messages"
          description="Communicate with job seekers"
          showCreateButton={false}
        />
        <div className="flex-1 flex">
          <div className="w-80 border-r bg-white dark:bg-background p-4">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (roomsError) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          title="Messages"
          description="Communicate with job seekers"
          showCreateButton={false}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Failed to load conversations</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Please check your connection and try again
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar 
        title="Messages"
        description="Communicate with job seekers"
        showCreateButton={false}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r bg-white dark:bg-background flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* WebSocket connection status */}
            <div className={`flex items-center gap-2 mt-2 text-xs ${connected ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              {connected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredRooms.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No conversations yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Conversations will appear here when candidates message you
                  </p>
                </div>
              ) : (
                filteredRooms.map((room: ChatRoom) => (
                  <div
                    key={room.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                      selectedConversation === room.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handleRoomSelect(room)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={room.content_object?.user?.avatar} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm truncate">
                            {room.content_object?.title || 'Job Application'}
                          </p>
                          {room.unread_message_count > 0 && (
                            <Badge className="ml-2 px-1.5 py-0.5 text-xs">
                              {room.unread_message_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mb-1">
                          {room.content_object?.user?.first_name} {room.content_object?.user?.last_name}
                        </p>
                        {room.last_message_text && (
                          <p className="text-xs text-gray-400 truncate">
                            {room.last_message_text}
                          </p>
                        )}
                        {room.last_message_date_created && (
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTime(room.last_message_date_created)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Select a conversation to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              {selectedConversationData && (
                <div className="border-b bg-white dark:bg-background p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversationData.content_object?.user?.avatar} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedConversationData.content_object?.user?.first_name}{' '}
                        {selectedConversationData.content_object?.user?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedConversationData.content_object?.title}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-gray-900/50">
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : allMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Start the conversation by sending a message
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allMessages.map((message: any, index: number) => {
                      // Convert to ChatMessage format
                      const chatMessage: ChatMessage = {
                        id: message.id,
                        room: message.room,
                        owner: message.owner?.id || message.owner,
                        text: message.text || "",
                        status: "delivered",
                        attachments: message.attachment_url ? [{
                          id: message.id,
                          file_name: message.attachment_name || "File",
                          file_url: message.attachment_url,
                          content_type: message.attachment_type,
                          size: message.attachment_size,
                        }] : [],
                        date_created: message.date_created,
                      };
                      
                      return (
                        <MessageRenderer
                          key={`${message.id}-${index}`}
                          message={chatMessage}
                          currentUser={user}
                        />
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t bg-white dark:bg-background">
                {selectedFile && (
                  <div className="p-4 border-b">
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      selectedFile={selectedFile}
                      onRemoveFile={handleRemoveFile}
                      disabled={sendingMessage || uploadingFile}
                    />
                    {uploadingFile && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                          <span>Uploading file...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <form onSubmit={handleSendMessage} className="p-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        disabled={sendingMessage || !connected}
                      />
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                      className="hidden"
                      accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.txt,.zip,.rar,.heic,.heif"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={sendingMessage || uploadingFile || !connected}
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                      title="Attach file"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      type="submit"
                      disabled={(!messageInput.trim() && !selectedFile) || sendingMessage || uploadingFile || !connected}
                      title={!connected ? "Not connected" : uploadingFile ? "Uploading file..." : "Send message"}
                    >
                      {sendingMessage || uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}