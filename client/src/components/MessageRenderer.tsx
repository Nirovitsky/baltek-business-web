import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, CheckCheck, Clock, AlertTriangle, RotateCcw, Download, FileText, Image, Video, Music, File } from 'lucide-react';
import type { ChatMessage, User } from '@/types';

interface MessageRendererProps {
  message: ChatMessage;
  currentUser: User | null;
  onRetry?: (messageId: string | number) => void;
}

export default function MessageRenderer({ message, currentUser, onRetry }: MessageRendererProps) {
  const isOwn = message.owner === currentUser?.id;
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp * 1000); // Convert from Unix timestamp
      
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
      console.error('MessageRenderer formatTime error:', error, timestamp);
      return '';
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = (user: any) => {
    if (!user) return 'U';
    const name = user.first_name || user.name || 'User';
    return name.charAt(0).toUpperCase();
  };

  // Render message status icon
  const renderStatusIcon = () => {
    if (!isOwn) return null;
    
    switch (message.status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <AlertTriangle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  // Render attachment
  const renderAttachment = (attachment: any) => {
    const isImage = attachment.content_type?.startsWith('image/');
    const isVideo = attachment.content_type?.startsWith('video/');
    const isAudio = attachment.content_type?.startsWith('audio/');
    const isPdf = attachment.content_type === 'application/pdf';
    
    const formatFileSize = (bytes: number) => {
      if (!bytes) return '';
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFileIcon = () => {
      if (isImage) return <Image className="h-4 w-4 text-green-500" />;
      if (isVideo) return <Video className="h-4 w-4 text-blue-500" />;
      if (isAudio) return <Music className="h-4 w-4 text-purple-500" />;
      if (isPdf) return <FileText className="h-4 w-4 text-red-500" />;
      return <File className="h-4 w-4 text-gray-500" />;
    };
    
    // Handle image attachments
    if (isImage && attachment.file_url) {
      return (
        <div key={attachment.id} className="max-w-xs group">
          <div className="relative overflow-hidden rounded-xl border-2 border-border/20 hover:border-primary/30 transition-all duration-200">
            <img
              src={attachment.file_url}
              alt={attachment.file_name || 'Image'}
              className="max-w-full max-h-64 object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
              onClick={() => window.open(attachment.file_url, '_blank')}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
          </div>
          {attachment.file_name && (
            <p className="text-xs text-muted-foreground mt-2 truncate px-1">{attachment.file_name}</p>
          )}
        </div>
      );
    }

    // Handle video attachments
    if (isVideo && attachment.file_url) {
      return (
        <div key={attachment.id} className="max-w-xs">
          <div className="relative overflow-hidden rounded-xl border-2 border-border/20">
            <video
              controls
              className="max-w-full max-h-64 rounded-xl"
              preload="metadata"
            >
              <source src={attachment.file_url} type={attachment.content_type} />
              Your browser does not support the video tag.
            </video>
          </div>
          {attachment.file_name && (
            <p className="text-xs text-muted-foreground mt-2 truncate px-1">{attachment.file_name}</p>
          )}
        </div>
      );
    }

    // Handle audio attachments
    if (isAudio && attachment.file_url) {
      return (
        <div key={attachment.id} className="max-w-xs">
          <audio controls className="w-full">
            <source src={attachment.file_url} type={attachment.content_type} />
            Your browser does not support the audio tag.
          </audio>
          {attachment.file_name && (
            <p className="text-xs text-gray-500 mt-1 truncate">{attachment.file_name}</p>
          )}
        </div>
      );
    }
    
    // Handle other file types (PDF, documents, etc.)
    return (
      <div
        key={attachment.id}
        className="flex items-center gap-3 p-4 border rounded-xl bg-background/50 dark:bg-gray-800/50 max-w-xs hover:shadow-md cursor-pointer transition-all duration-200 hover:scale-105"
        onClick={() => attachment.file_url && window.open(attachment.file_url, '_blank')}
      >
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            {getFileIcon()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate text-foreground">
            {attachment.file_name || attachment.name || 'File'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {attachment.content_type && (
              <Badge variant="secondary" className="text-xs px-2 py-1 rounded-full">
                {attachment.content_type.split('/')[1]?.toUpperCase() || 'FILE'}
              </Badge>
            )}
            {attachment.size && (
              <span className="text-xs text-muted-foreground font-medium">
                {formatFileSize(attachment.size)}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Download className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>
    );
  };

  // Helper functions
  const renderAvatar = () => {
    if (isOwn) return null;
    
    if (message.senderInfo?.id) {
      return (
        <Link to={`/user/${message.senderInfo.id}`}>
          <Avatar className="h-8 w-8 flex-shrink-0 hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer">
            <AvatarImage 
              src={message.senderInfo?.avatar} 
              alt={`${message.senderInfo?.first_name || 'User'} avatar`}
            />
            <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
              {message.senderInfo?.first_name?.[0]?.toUpperCase() || 
               message.senderInfo?.last_name?.[0]?.toUpperCase() || 
               'U'}
            </AvatarFallback>
          </Avatar>
        </Link>
      );
    }
    
    return (
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage 
          src={message.senderInfo?.avatar} 
          alt={`${message.senderInfo?.first_name || 'User'} avatar`}
        />
        <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
          {message.senderInfo?.first_name?.[0]?.toUpperCase() || 
           message.senderInfo?.last_name?.[0]?.toUpperCase() || 
           'U'}
        </AvatarFallback>
      </Avatar>
    );
  };

  const renderMessageMetadata = (showRetry = true) => (
    <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
      isOwn ? 'flex-row-reverse' : 'flex-row'
    }`}>
      <span>{formatTime(message.date_created)}</span>
      {renderStatusIcon()}
      
      {message.status === 'failed' && onRetry && showRetry && (
        <Button
          size="sm"
          variant="ghost"
          className="h-auto p-1 text-xs"
          onClick={() => onRetry(message.id)}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );

  const hasText = message.text && message.text.trim();
  const hasAttachments = message.attachments && message.attachments.length > 0;

  // If message has both text and attachments, show them as separate bubbles
  if (hasText && hasAttachments) {
    return (
      <div className="space-y-2 mb-4">
        {/* Text bubble */}
        <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {renderAvatar()}
          <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
            {!isOwn && (
              <div className="text-xs text-gray-500 mb-1">
                {message.senderInfo?.first_name || 'User'}
              </div>
            )}
            
            <div className={`rounded-lg px-3 py-2 ${
              isOwn 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
            }`}>
              <div className="whitespace-pre-wrap break-words">
                {message.text}
              </div>
            </div>
          </div>
        </div>

        {/* Attachments bubble */}
        <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {!isOwn && <div className="w-8" />} {/* Spacer for alignment */}
          <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
            <div className="space-y-2">
              {message.attachments.map(renderAttachment)}
            </div>
            
            {renderMessageMetadata()}
            
            {message.error && (
              <div className="text-xs text-red-500 mt-1 max-w-xs">
                {message.error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Single bubble for text only or attachments only
  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {renderAvatar()}
      
      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <div className="text-xs text-gray-500 mb-1">
            {message.senderInfo?.first_name || 'User'}
          </div>
        )}
        
        {hasText && (
          <div className={`rounded-lg px-3 py-2 ${
            isOwn 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
          }`}>
            <div className="whitespace-pre-wrap break-words">
              {message.text}
            </div>
          </div>
        )}
        
        {hasAttachments && !hasText && (
          <div className="space-y-2">
            {message.attachments.map(renderAttachment)}
          </div>
        )}
        
        {renderMessageMetadata()}
        
        {message.error && (
          <div className="text-xs text-red-500 mt-1 max-w-xs">
            {message.error}
          </div>
        )}
      </div>
    </div>
  );
}