import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import MessageRenderer from "@/components/MessageRenderer";
import ImageModal from "@/components/ImageModal";
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
  Paperclip,
  Check,
  FileText,
  X
} from "lucide-react";
import type { ChatMessage, ChatRoom, MessageAttachment } from "@/types";

export default function Messages() {
  const { user, selectedOrganization } = useAuth();
  
  // Try to decode user info from token
  const getUserFromToken = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { id: payload.user_id, ...payload };
    } catch (error) {
      return null;
    }
  };
  
  const tokenUser = getUserFromToken();
  const activeUser = user || tokenUser;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedAttachment, setUploadedAttachment] = useState<{id: number, name: string, url: string} | null>(null);
  const [imageModal, setImageModal] = useState<{ src: string; alt: string } | null>(null);
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

  // Fetch chat rooms filtered by selected organization
  const {
    data: chatRooms,
    isLoading: roomsLoading,
    error: roomsError,
  } = useChatRooms(selectedOrganization?.id);

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

  // Helper function to infer content type from file name/path
  const inferContentType = (fileName: string, filePath: string): string => {
    if (!fileName && !filePath) return 'application/octet-stream';
    
    const name = fileName || filePath;
    const extension = name.toLowerCase().split('.').pop();
    
    const mimeTypes: { [key: string]: string } = {
      // Images
      'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
      'gif': 'image/gif', 'webp': 'image/webp', 'svg': 'image/svg+xml',
      'heic': 'image/heic', 'heif': 'image/heif',
      // Videos
      'mp4': 'video/mp4', 'webm': 'video/webm', 'avi': 'video/avi', 'mov': 'video/quicktime',
      // Audio
      'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'm4a': 'audio/m4a', 'ogg': 'audio/ogg',
      // Documents
      'pdf': 'application/pdf', 'txt': 'text/plain',
      'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel', 'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint', 'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Archives
      'zip': 'application/zip', 'rar': 'application/x-rar-compressed',
    };
    
    return mimeTypes[extension || ''] || 'application/octet-stream';
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
    if ((!messageInput.trim() && !uploadedAttachment) || !selectedConversation) return;

    setSendingMessage(true);
    
    try {
      // Use the already uploaded attachment if available
      const attachmentId = uploadedAttachment?.id;
      
      // Send message via WebSocket
      const success = sendMessage(
        selectedConversation, 
        messageInput.trim(), 
        attachmentId ? [attachmentId] : undefined
      );
      
      if (success) {
        setMessageInput("");
        setSelectedFile(null);
        setUploadedAttachment(null);
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

  // Handle file selection and immediate upload
  const handleFileSelect = async (file: File) => {
    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    setSelectedFile(file);
    setUploadedAttachment(null);
    
    // Start uploading immediately
    setUploadingFile(true);
    setUploadProgress(0);
    
    try {
      const upload = uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });
      
      const result = await upload.promise;
      console.log('Upload successful:', result);
      
      setUploadedAttachment({
        id: result.id,
        name: file.name,
        url: result.path || result.file_url || result.url
      });
      setUploadProgress(100);
      
      toast({
        title: "File uploaded",
        description: `${file.name} is ready to send`,
      });
      
    } catch (uploadError) {
      console.error("File upload failed:", uploadError);
      toast({
        title: "Upload failed",
        description: "Could not upload your file. Please try again.",
        variant: "destructive",
      });
      // Clear the selected file on upload failure
      setSelectedFile(null);
    } finally {
      setUploadingFile(false);
      setTimeout(() => setUploadProgress(0), 1000); // Clear progress after a delay
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadedAttachment(null);
    setUploadProgress(0);
  };

  // Handle room selection
  const handleRoomSelect = (room: ChatRoom) => {
    setSelectedConversation(room.id);
    setMessageInput("");
    setSelectedFile(null);
    setUploadedAttachment(null);
    
    // Debug log to verify organization filtering
    console.log('Selected room organization:', room.content_object?.job?.organization?.display_name);
    console.log('Current selected organization:', selectedOrganization?.display_name);
    
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
          description={`Communicate with job seekers${selectedOrganization ? ` for ${selectedOrganization.display_name}` : ''}`}
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
          description={`Communicate with job seekers${selectedOrganization ? ` for ${selectedOrganization.display_name}` : ''}`}
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
        description={`Communicate with job seekers${selectedOrganization ? ` for ${selectedOrganization.display_name}` : ''}`}
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
                        {room.content_object?.owner?.id ? (
                          <Link to={`/user/${room.content_object.owner.id}`}>
                            <Avatar className="h-10 w-10 hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer">
                              <AvatarImage 
                                src={room.content_object?.owner?.avatar} 
                                alt={`${room.content_object?.owner?.first_name} ${room.content_object?.owner?.last_name}`}
                              />
                              <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                                {room.content_object?.owner?.first_name?.[0]?.toUpperCase() || 
                                 room.content_object?.owner?.last_name?.[0]?.toUpperCase() || 
                                 <User className="h-5 w-5" />}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                        ) : (
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={room.content_object?.owner?.avatar} 
                              alt={`${room.content_object?.owner?.first_name} ${room.content_object?.owner?.last_name}`}
                            />
                            <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                              {room.content_object?.owner?.first_name?.[0]?.toUpperCase() || 
                               room.content_object?.owner?.last_name?.[0]?.toUpperCase() || 
                               <User className="h-5 w-5" />}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm truncate">
                            {room.content_object?.owner?.first_name && room.content_object?.owner?.last_name 
                              ? `${room.content_object.owner.first_name} ${room.content_object.owner.last_name} - ${room.content_object?.job?.title || 'Job Application'}`
                              : room.content_object?.job?.title || 'Job Application'
                            }
                          </p>
                          {room.unread_message_count > 0 && (
                            <Badge className="ml-2 px-1.5 py-0.5 text-xs">
                              {room.unread_message_count}
                            </Badge>
                          )}
                        </div>
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
                    {selectedConversationData.content_object?.owner?.id ? (
                      <Link to={`/user/${selectedConversationData.content_object.owner.id}`}>
                        <Avatar className="h-10 w-10 hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer">
                          <AvatarImage 
                            src={selectedConversationData.content_object?.owner?.avatar} 
                            alt={`${selectedConversationData.content_object?.owner?.first_name} ${selectedConversationData.content_object?.owner?.last_name}`}
                          />
                          <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                            {selectedConversationData.content_object?.owner?.first_name?.[0]?.toUpperCase() || 
                             selectedConversationData.content_object?.owner?.last_name?.[0]?.toUpperCase() || 
                             <User className="h-5 w-5" />}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                    ) : (
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={selectedConversationData.content_object?.owner?.avatar} 
                          alt={`${selectedConversationData.content_object?.owner?.first_name} ${selectedConversationData.content_object?.owner?.last_name}`}
                        />
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                          {selectedConversationData.content_object?.owner?.first_name?.[0]?.toUpperCase() || 
                           selectedConversationData.content_object?.owner?.last_name?.[0]?.toUpperCase() || 
                           <User className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <p className="font-medium">
                        {selectedConversationData.content_object?.owner?.first_name}{' '}
                        {selectedConversationData.content_object?.owner?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Applied for {selectedConversationData.content_object?.job?.title}
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
                      // Debug log for messages with attachments
                      if (message.attachments && message.attachments.length > 0) {
                        console.log('Message with attachments:', message.id, message.attachments);
                      }
                      
                      // Get the sender's user info 
                      const applicant = selectedConversationData?.content_object?.owner;
                      const messageOwnerId = message.owner?.id || message.owner;
                      
                      
                      // Convert to ChatMessage format
                      const chatMessage: ChatMessage = {
                        id: message.id,
                        room: message.room,
                        owner: messageOwnerId,
                        // Pass the correct user info for avatar display
                        senderInfo: messageOwnerId === applicant?.id ? applicant : null,
                        text: message.text || "",
                        status: "delivered",
                        attachments: message.attachments && message.attachments.length > 0 ? 
                          message.attachments.map((att: any) => ({
                            id: att.id,
                            file_name: att.name,
                            file_url: att.path,
                            content_type: inferContentType(att.name, att.path),
                            size: att.size || null,
                          })) : [],
                        date_created: message.date_created,
                      };
                      
                      
                      return (
                        <MessageRenderer
                          key={`${message.id}-${index}`}
                          message={chatMessage}
                          currentUser={activeUser}
                          onImageClick={(src, alt) => setImageModal({ src, alt })}
                        />
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t bg-white dark:bg-background">
                {/* File Attachments Preview */}
                {(selectedFile || uploadedAttachment) && (
                  <div className="p-4 border-b bg-muted/10">
                    <div className="space-y-3">
                      {uploadingFile && (
                        <div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                            <span className="font-medium">Uploading {selectedFile?.name}...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-muted/50 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {uploadedAttachment && !uploadingFile && (
                        <div className="flex items-center p-3 bg-background rounded-lg border shadow-sm">
                          <div className="flex-shrink-0 mr-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {uploadedAttachment.name}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                              <Check className="w-3 h-3 mr-1" />
                              Ready to send
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveFile}
                            className="ml-2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSendMessage} className="p-4">
                  <div className="flex items-end gap-3">
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
                      variant="ghost"
                      size="sm"
                      disabled={sendingMessage || uploadingFile || !connected}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10 w-10 p-0 rounded-lg hover:bg-muted flex-shrink-0"
                      title="Attach file"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex-1">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        disabled={sendingMessage || !connected}
                        className="h-10"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={(!messageInput.trim() && !uploadedAttachment) || sendingMessage || uploadingFile || !connected}
                      className="h-10 w-10 p-0 rounded-lg flex-shrink-0"
                      title={!connected ? "Not connected" : uploadingFile ? "Uploading file..." : "Send message"}
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
      
      {imageModal && (
        <ImageModal
          src={imageModal.src}
          alt={imageModal.alt}
          isOpen={!!imageModal}
          onClose={() => setImageModal(null)}
        />
      )}
    </div>
  );
}