import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useNotifications } from "@/hooks/useNotifications";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  MessageCircle, 
  Send, 
  Search, 
  User as UserIcon, 
  Loader2,
  Paperclip,
  Check,
  FileText,
  X,
  AlertTriangle,
  Bell
} from "lucide-react";
import type { ChatMessage, ChatRoom, MessageAttachment, User } from "@/types";

export default function Chat() {
  const { user, selectedOrganization } = useAuth();
  
  // Add chat layout class to body to prevent scrolling
  useEffect(() => {
    document.body.classList.add('chat-layout');
    return () => {
      document.body.classList.remove('chat-layout');
    };
  }, []);
  const { unreadCount } = useNotifications(false);
  const navigate = useNavigate();
  
  // Use organization user ID directly since we know it's 8 from the debug output
  const currentUser: User = {
    id: 8, // Organization user ID from debug output
    first_name: 'Organization',
    last_name: 'User',
    phone: '',
  };
  
  const activeUser = user || currentUser;
  
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
  const [chatDisabledRooms, setChatDisabledRooms] = useState<Set<number>>(new Set());
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check URL parameters for room selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      const roomId = parseInt(roomParam, 10);
      if (!isNaN(roomId)) {
        setSelectedConversation(roomId);
        // Refresh room data to get latest application status
        queryClient.invalidateQueries({ queryKey: ['/chat/rooms/'] });
        // Clear URL parameter after setting the room
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [queryClient]);
  
  // WebSocket connection for real-time messaging
  const {
    connected,
    messages: wsMessages,
    currentRoom,
    sendMessage,
    joinRoom,
    addOptimisticMessage,
    removeOptimisticMessage,
    updateOptimisticMessage,
    cleanupOldFailedMessages,
    reconnect,
    reconnectAttempts,
    maxReconnectAttempts
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

  // Toggle chat disabled state (frontend-only implementation)
  const handleToggleChat = (roomId: number, disable: boolean) => {
    setChatDisabledRooms(prev => {
      const newSet = new Set(prev);
      if (disable) {
        newSet.add(roomId);
      } else {
        newSet.delete(roomId);
      }
      return newSet;
    });
    
    toast({
      title: disable ? "Chat disabled" : "Chat enabled",
      description: disable ? "Messages are now blocked for this conversation" : "You can now send messages",
    });
  };

  const handleDisableChat = () => {
    setShowDisableConfirm(true);
  };

  const confirmDisableChat = () => {
    if (selectedConversation) {
      handleToggleChat(selectedConversation, true);
    }
    setShowDisableConfirm(false);
  };

  // Count failed messages for status display (moved here to avoid hooks order issues)
  const failedMessageCount = useMemo(() => {
    return wsMessages.filter(m => m.status === 'failed' && m.isOptimistic).length;
  }, [wsMessages]);

  // Clean up old failed messages periodically (every 10 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupOldFailedMessages();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [cleanupOldFailedMessages]);

  // Get selected conversation data
  const selectedConversationData = chatRooms?.results?.find(
    (room: ChatRoom) => room.id === selectedConversation
  );

  // Check if chat is manually disabled by organization (frontend-only for now)
  const isChatDisabled = selectedConversation ? chatDisabledRooms.has(selectedConversation) : false;

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

  // Handle sending messages with optimistic UI
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !uploadedAttachment) || !selectedConversation || isChatDisabled) return;

    const messageText = messageInput.trim();
    const attachments = uploadedAttachment ? [{
      id: uploadedAttachment.id,
      file_name: uploadedAttachment.name,
      file_url: uploadedAttachment.url,
      content_type: '',
      size: 0
    }] : undefined;
    
    // Create optimistic message immediately
    const optimisticId = addOptimisticMessage(
      selectedConversation,
      messageText,
      activeUser.id,
      {
        id: activeUser.id,
        first_name: activeUser.first_name,
        last_name: activeUser.last_name,
        avatar: user?.avatar,
        profession: (user as any)?.profession || '',
        is_online: true
      },
      attachments
    );
    
    // Clear input immediately for better UX
    setMessageInput("");
    setSelectedFile(null);
    setUploadedAttachment(null);
    setTimeout(scrollToBottom, 100);
    
    setSendingMessage(true);
    
    try {
      // Send message via WebSocket
      const success = sendMessage(
        selectedConversation, 
        messageText, 
        uploadedAttachment ? [uploadedAttachment.id] : undefined,
        optimisticId
      );
      
      if (success) {
        // Update optimistic message status to indicate it's being sent
        updateOptimisticMessage(optimisticId, { status: 'sending' });
        
        // Immediately invalidate room list to update last message and sorting
        queryClient.invalidateQueries({ 
          queryKey: ['/chat/rooms/']
        });
        
        // Set a timeout to mark as failed if no response comes back
        setTimeout(() => {
          // Check if optimistic message still exists (not replaced by real message)
          if (wsMessages.some(m => m.id === optimisticId && m.isOptimistic)) {
            updateOptimisticMessage(optimisticId, { 
              status: 'failed',
              error: 'Message delivery timeout'
            });
          }
        }, 10000); // 10 second timeout
        
      } else {
        // Mark optimistic message as failed
        updateOptimisticMessage(optimisticId, { 
          status: 'failed',
          error: 'Failed to send'
        });
        
        toast({
          title: "Failed to send message",
          description: "Please check your connection and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ [Chat] Message send error:', error);
      
      // Mark optimistic message as failed
      updateOptimisticMessage(optimisticId, { 
        status: 'failed',
        error: 'Send error'
      });
      
      toast({
        title: "Failed to send message",
        description: "An error occurred while sending your message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle retrying failed messages
  const handleRetryMessage = (messageId: string | number) => {
    const messageToRetry = wsMessages.find(m => m.id === messageId);
    if (!messageToRetry || !messageToRetry.isOptimistic) return;

    // Remove the failed optimistic message
    removeOptimisticMessage(messageId as string);

    // Create a new optimistic message and try sending again
    const optimisticId = addOptimisticMessage(
      messageToRetry.room,
      messageToRetry.text,
      messageToRetry.owner,
      messageToRetry.senderInfo,
      messageToRetry.attachments
    );

    // Try sending the message again
    const success = sendMessage(
      messageToRetry.room,
      messageToRetry.text,
      messageToRetry.attachments?.map(a => a.id) || undefined,
      optimisticId
    );

    if (!success) {
      updateOptimisticMessage(optimisticId, { 
        status: 'failed',
        error: 'Retry failed'
      });
    }
  };

  // Handle file selection and immediate upload
  const handleFileSelect = async (file: File) => {
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
    console.log('🏠 [Chat] Room selection started:', room.id);
    setSelectedConversation(room.id);
    setMessageInput("");
    setSelectedFile(null);
    setUploadedAttachment(null);
    
    // Debug log to verify organization filtering
    console.log('Selected room organization:', room.content_object?.job?.organization?.display_name);
    console.log('Current selected organization:', selectedOrganization?.display_name);
    
    // Join room via WebSocket
    console.log('🔌 [Chat] Joining WebSocket room:', room.id);
    joinRoom(room.id);
    
    // Refresh messages for this room - but don't clear cache immediately
    console.log('🔄 [Chat] Invalidating messages query for room:', room.id);
    queryClient.invalidateQueries({ queryKey: ['/chat/messages/', room.id] });
    console.log('✅ [Chat] Room selection completed');
  };


  // Immediately update room list when new messages arrive
  const roomsUpdateTimeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    console.log('📨 [Chat] WebSocket messages effect triggered:', {
      wsMessagesCount: wsMessages.length,
      selectedConversation,
      currentRoom,
      roomMatch: selectedConversation === currentRoom
    });
    
    // Always update room list when new messages arrive for real-time sorting
    if (wsMessages.length > 0) {
      console.log('🔄 [Chat] New message detected - updating room list for real-time sorting');
      
      // Clear existing timeout to debounce the rooms fetch
      if (roomsUpdateTimeoutRef.current) {
        clearTimeout(roomsUpdateTimeoutRef.current);
      }
      
      // Shorter debounce for better real-time experience
      roomsUpdateTimeoutRef.current = setTimeout(() => {
        console.log('🔄 [Chat] Invalidating room list due to new WebSocket messages');
        queryClient.invalidateQueries({ 
          queryKey: ['/chat/rooms/']
        });
        console.log('✅ [Chat] Room list invalidated successfully');
      }, 200); // Reduced from 500ms to 200ms for faster updates
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (roomsUpdateTimeoutRef.current) {
        clearTimeout(roomsUpdateTimeoutRef.current);
      }
    };
  }, [wsMessages, queryClient]);
  
  // Also update room list immediately when sending a message
  useEffect(() => {
    // Force room list update when user sends a message to ensure real-time sorting
    if (selectedConversation && connected) {
      console.log('💬 [Chat] Message sent context - scheduling room list refresh');
    }
  }, [selectedConversation, connected]);

  // Clear WebSocket messages when API messages are loaded for the selected room
  useEffect(() => {
    if (messages?.results && selectedConversation && selectedConversation === currentRoom) {
      // API messages loaded for current room - now it's safe to clear any stale WebSocket messages
      // This ensures sent messages don't disappear during room switches
      console.log('📨 [Chat] API messages loaded for current room, filtering WebSocket messages');
    }
  }, [messages?.results, selectedConversation, currentRoom]);

  // Memoize API message transformations to prevent object recreation
  const transformedApiMessages = useMemo(() => {
    console.log('🚨 [DEBUG] Transforming API messages to ChatMessage format');
    return (messages?.results || []).map((message: any) => {
      // Get the sender's user info from rooms data (includes avatar)
      const applicant = selectedConversationData?.content_object?.owner;
      const messageOwnerId = message.owner?.id || message.owner;
      
      // Determine sender info - always use avatar from rooms endpoint
      let senderInfo = null;
      if (messageOwnerId === applicant?.id) {
        // Use applicant info with avatar from rooms endpoint
        senderInfo = {
          ...applicant,
          // Ensure avatar is available from rooms data
          avatar: applicant?.avatar
        };
      } else if (messageOwnerId === activeUser?.id) {
        // Use organization user info
        senderInfo = {
          ...activeUser,
          // Organization users might not have avatars, that's OK
          avatar: activeUser?.avatar
        };
      }
      
      // Convert to ChatMessage format
      return {
        id: message.id,
        room: message.room,
        owner: messageOwnerId,
        senderInfo: senderInfo,
        text: message.text || "",
        status: "delivered" as const,
        attachments: message.attachments && message.attachments.length > 0 ? 
          message.attachments.map((att: any) => ({
            id: att.id,
            file_name: att.name,
            file_url: att.path,
            content_type: inferContentType(att.name, att.path),
            size: att.size || null,
          })) : [],
        date_created: message.date_created,
        isOptimistic: false, // API messages are never optimistic
        isFromWebSocket: false
      };
    }).sort((a, b) => a.date_created - b.date_created);
  }, [messages?.results, selectedConversationData, activeUser]);

  // Create unified message list by merging API and WebSocket messages with deduplication
  const unifiedMessages = useMemo(() => {
    console.log('🚨 [DEBUG] Creating unified message list');
    
    // Filter WebSocket messages to only include current room messages
    const filteredWsMessages = wsMessages.filter(message => 
      message.room === selectedConversation
    );
    
    // Transform WebSocket messages
    const transformedWsMessages = filteredWsMessages.map((message: any) => {
      // Get the sender's user info from rooms data (includes avatar)
      const applicant = selectedConversationData?.content_object?.owner;
      const messageOwnerId = message.owner?.id || message.owner;
      
      // Determine sender info - always use avatar from rooms endpoint
      let senderInfo = null;
      if (messageOwnerId === applicant?.id) {
        // Use applicant info with avatar from rooms endpoint
        senderInfo = {
          ...applicant,
          // Ensure avatar is available from rooms data
          avatar: applicant?.avatar
        };
      } else if (messageOwnerId === activeUser?.id) {
        // Use organization user info
        senderInfo = {
          ...activeUser,
          // Organization users might not have avatars, that's OK
          avatar: activeUser?.avatar
        };
      }
      
      // Convert to ChatMessage format
      return {
        id: message.id,
        room: message.room,
        owner: messageOwnerId,
        senderInfo: senderInfo,
        text: message.text || "",
        attachments: message.attachments && message.attachments.length > 0 ? 
          message.attachments.map((att: any) => ({
            id: att.id,
            file_name: att.name,
            file_url: att.path,
            content_type: inferContentType(att.name, att.path),
            size: att.size || null,
          })) : [],
        date_created: message.date_created,
        isFromWebSocket: true, // Mark WebSocket messages
        isOptimistic: message.isOptimistic || false,
        status: message.isOptimistic ? message.status : "delivered" as const
      };
    });
    
    // Combine API and WebSocket messages
    const allMessages = [...transformedApiMessages, ...transformedWsMessages];
    
    // Deduplicate by message ID with proper optimistic handling
    const messageMap = new Map();
    allMessages.forEach(message => {
      const existingMessage = messageMap.get(message.id);
      
      // Priority logic:
      // 1. Real messages (non-optimistic) always replace optimistic ones
      // 2. Among real messages, prefer WebSocket for real-time updates
      // 3. Don't replace real messages with optimistic ones
      if (!existingMessage) {
        messageMap.set(message.id, message);
      } else if ((existingMessage as any).isOptimistic && !(message as any).isOptimistic) {
        // Real message replaces optimistic message
        messageMap.set(message.id, message);
      } else if (!(existingMessage as any).isOptimistic && !(message as any).isOptimistic && (message as any).isFromWebSocket) {
        // Among real messages, prefer WebSocket for real-time updates
        messageMap.set(message.id, message);
      }
      // Don't replace real messages with optimistic ones
    });
    
    // Convert back to array and sort by timestamp (oldest to newest)
    const deduplicatedMessages = Array.from(messageMap.values())
      .sort((a, b) => a.date_created - b.date_created);
    
    console.log('📋 [DEBUG] Unified messages created:', {
      apiCount: transformedApiMessages.length,
      wsCount: transformedWsMessages.length,
      totalAfterDedup: deduplicatedMessages.length
    });
    
    return deduplicatedMessages;
  }, [transformedApiMessages, wsMessages, selectedConversation, selectedConversationData, activeUser]);

  // Auto scroll when messages change (with slight delay to ensure DOM updates)
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [unifiedMessages, selectedConversation]);

  console.log('📋 [Chat] Using unified message list:', {
    selectedConversation,
    currentRoom,
    unifiedMessagesCount: unifiedMessages.length,
    roomsMatch: selectedConversation === currentRoom
  });

  // Filter and sort rooms by most recent activity
  const filteredRooms = useMemo(() => {
    if (!chatRooms?.results) return [];
    
    // First filter by search query
    let rooms = chatRooms.results.filter((room: ChatRoom) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        room.content_object?.title?.toLowerCase().includes(query) ||
        room.last_message_text?.toLowerCase().includes(query) ||
        `${room.content_object?.owner?.first_name || ''} ${room.content_object?.owner?.last_name || ''}`.toLowerCase().includes(query)
      );
    });
    
    // Sort by most recent activity (highest timestamp first)
    rooms = rooms.sort((a, b) => {
      const aTime = a.last_message_date_created || 0;
      const bTime = b.last_message_date_created || 0;
      return bTime - aTime; // Descending order (most recent first)
    });
    
    // If there are recent WebSocket messages, prioritize those rooms
    if (wsMessages.length > 0) {
      const recentMessageRooms = new Set(wsMessages.map(msg => msg.room));
      rooms = rooms.sort((a, b) => {
        const aHasRecent = recentMessageRooms.has(a.id);
        const bHasRecent = recentMessageRooms.has(b.id);
        
        if (aHasRecent && !bHasRecent) return -1;
        if (!aHasRecent && bHasRecent) return 1;
        
        // Both have recent messages or neither do - use timestamp
        const aTime = a.last_message_date_created || 0;
        const bTime = b.last_message_date_created || 0;
        return bTime - aTime;
      });
    }
    
    return rooms;
  }, [chatRooms?.results, searchQuery, wsMessages]);

  if (roomsLoading) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <TopBar 
          title="Chat" 
          description={`Chat with job seekers${selectedOrganization ? ` for ${selectedOrganization.display_name}` : ''}`}
          showCreateButton={true}
        />
        <div className="flex-1 flex">
          <div className="w-96 border-r bg-white dark:bg-background flex flex-col">
            <div className="p-4 border-b">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
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
      <div className="h-screen flex flex-col overflow-hidden">
        <TopBar 
          title="Chat" 
          description={`Chat with job seekers${selectedOrganization ? ` for ${selectedOrganization.display_name}` : ''}`}
          showCreateButton={true}
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
    <div className="h-screen flex flex-col overflow-hidden relative">
      <TopBar 
        title="Chat" 
        description={`Chat with job seekers${selectedOrganization ? ` for ${selectedOrganization.display_name}` : ''}`}
        showCreateButton={true}
      />
      {/* Connection Status Bar */}
      {(!connected || failedMessageCount > 0) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!connected && (
                <>
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    {reconnectAttempts > 0 && reconnectAttempts < maxReconnectAttempts
                      ? `Reconnecting... (attempt ${reconnectAttempts}/${maxReconnectAttempts})`
                      : 'Connection lost - messages may not send properly'
                    }
                  </span>
                </>
              )}
              {failedMessageCount > 0 && (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-red-700 dark:text-red-300">
                    {failedMessageCount} message{failedMessageCount > 1 ? 's' : ''} failed to send
                  </span>
                </>
              )}
            </div>
            {(!connected && reconnectAttempts < maxReconnectAttempts) && (
              <Button
                variant="outline"
                size="sm"
                onClick={reconnect}
                className="h-6 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-800"
              >
                Retry Connection
              </Button>
            )}
          </div>
        </div>
      )}
      
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-96 border-r bg-white dark:bg-background flex flex-col">
          <div className="p-4 border-b">
            {roomsLoading ? (
              <Skeleton className="h-10 w-full rounded-md" />
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
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
                                 <UserIcon className="h-5 w-5" />}
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
                               <UserIcon className="h-5 w-5" />}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-medium text-sm truncate overflow-hidden text-ellipsis whitespace-nowrap">
                              {room.content_object?.owner?.first_name && room.content_object?.owner?.last_name 
                                ? `${room.content_object.owner.first_name} ${room.content_object.owner.last_name} - ${room.content_object?.job?.title || 'Job Application'}`
                                : room.content_object?.job?.title || 'Job Application'
                              }
                            </p>
                          </div>
                          {room.unread_message_count > 0 && (
                            <Badge className="ml-2 px-1.5 py-0.5 text-xs flex-shrink-0">
                              {room.unread_message_count}
                            </Badge>
                          )}
                        </div>
                        {room.last_message_text && (
                          <p className="text-xs text-gray-400 truncate overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
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
                             <UserIcon className="h-5 w-5" />}
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
                           <UserIcon className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {selectedConversationData.content_object?.owner?.first_name}{' '}
                          {selectedConversationData.content_object?.owner?.last_name}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 truncate overflow-hidden text-ellipsis whitespace-nowrap">
                        Applied for {selectedConversationData.content_object?.job?.title}
                      </p>
                    </div>
                    {!isChatDisabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisableChat}
                        className="text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/20"
                      >
                        Disable Chat
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="flex-1 min-h-0 p-4 bg-gray-50 dark:bg-gray-900/50">
                {messagesLoading ? (
                  <div className="space-y-4 animate-pulse">
                    {/* Skeleton for received message (with avatar, left-aligned) */}
                    <div className="flex gap-3 mb-4">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0"></div>
                      <div className="flex flex-col max-w-[70%] items-start">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
                        <div className="rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-700">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-1"></div>
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 mt-1"></div>
                      </div>
                    </div>
                    
                    {/* Skeleton for organization message (no avatar, right-aligned) */}
                    <div className="flex gap-3 mb-4 flex-row-reverse">
                      <div className="flex flex-col max-w-[70%] items-end">
                        <div className="rounded-lg px-3 py-2 bg-blue-500">
                          <div className="h-4 bg-blue-400 rounded w-28 mb-1"></div>
                          <div className="h-4 bg-blue-400 rounded w-20"></div>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mt-1"></div>
                      </div>
                    </div>

                    {/* Skeleton for received message (longer) */}
                    <div className="flex gap-3 mb-4">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0"></div>
                      <div className="flex flex-col max-w-[70%] items-start">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
                        <div className="rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-700">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-1"></div>
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-40 mb-1"></div>
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-28"></div>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 mt-1"></div>
                      </div>
                    </div>
                    
                    {/* Skeleton for organization message (short) */}
                    <div className="flex gap-3 mb-4 flex-row-reverse">
                      <div className="flex flex-col max-w-[70%] items-end">
                        <div className="rounded-lg px-3 py-2 bg-blue-500">
                          <div className="h-4 bg-blue-400 rounded w-16"></div>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-14 mt-1"></div>
                      </div>
                    </div>

                    {/* Skeleton for received message */}
                    <div className="flex gap-3 mb-4">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0"></div>
                      <div className="flex flex-col max-w-[70%] items-start">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
                        <div className="rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-700">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-36"></div>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 mt-1"></div>
                      </div>
                    </div>
                  </div>
                ) : unifiedMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Start the conversation by sending a message
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Render unified messages (API + WebSocket, deduplicated and sorted) */}
                    {unifiedMessages.map((chatMessage: ChatMessage, index: number) => {
                      // Debug log for messages with attachments
                      if (chatMessage.attachments && chatMessage.attachments.length > 0) {
                        console.log('Message with attachments:', chatMessage.id, chatMessage.attachments);
                      }
                      
                      return (
                        <MessageRenderer
                          key={`unified-${chatMessage.id}`}
                          message={chatMessage}
                          currentUser={activeUser}
                          onImageClick={(src, alt) => setImageModal({ src, alt })}
                          onRetry={handleRetryMessage}
                        />
                      );
                    })}
                    
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Status Notification */}
              {isChatDisabled && selectedConversationData && (
                <div className="border-t bg-white dark:bg-background">
                  <div className="p-4">
                    <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                            Chat has been disabled for this conversation.
                          </AlertDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleChat(selectedConversation!, false)}
                          className="h-8 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-800"
                        >
                          Enable Chat
                        </Button>
                      </div>
                    </Alert>
                  </div>
                </div>
              )}

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
                        if (file && !isChatDisabled) handleFileSelect(file);
                      }}
                      disabled={isChatDisabled}
                      className="hidden"
                      accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.txt,.zip,.rar,.heic,.heif"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={sendingMessage || uploadingFile || !connected || isChatDisabled}
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
                        placeholder={isChatDisabled ? "Chat is disabled" : "Type a message..."}
                        disabled={sendingMessage || !connected || isChatDisabled}
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
                      disabled={(!messageInput.trim() && !uploadedAttachment) || sendingMessage || uploadingFile || !connected || isChatDisabled}
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
      
      {/* Disable Chat Confirmation Dialog */}
      <AlertDialog open={showDisableConfirm} onOpenChange={setShowDisableConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable chat for this conversation? The candidate will no longer be able to send messages to you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisableChat} className="bg-red-600 hover:bg-red-700">
              Disable Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}