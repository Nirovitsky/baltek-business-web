import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, CheckCheck, Clock, AlertTriangle, RotateCcw, Download } from 'lucide-react';
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
    const date = new Date(timestamp * 1000); // Convert from Unix timestamp
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
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
    
    if (isImage && attachment.file_url) {
      return (
        <img
          key={attachment.id}
          src={attachment.file_url}
          alt={attachment.file_name}
          className="max-w-xs max-h-64 rounded-lg object-cover cursor-pointer"
          onClick={() => window.open(attachment.file_url, '_blank')}
        />
      );
    }
    
    return (
      <div
        key={attachment.id}
        className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 max-w-xs"
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{attachment.file_name}</p>
          {attachment.size && (
            <p className="text-xs text-gray-500">
              {(attachment.size / 1024 / 1024).toFixed(1)} MB
            </p>
          )}
        </div>
        {attachment.file_url && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(attachment.file_url, '_blank')}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={(message.owner as any)?.avatar} alt="User avatar" />
          <AvatarFallback>{getUserInitials(message.owner)}</AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <div className="text-xs text-gray-500 mb-1">
            {(message.owner as any)?.first_name || 'User'}
          </div>
        )}
        
        <div className={`rounded-lg px-3 py-2 ${
          isOwn 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
        }`}>
          {message.text && (
            <div className="whitespace-pre-wrap break-words">
              {message.text}
            </div>
          )}
          
          {message.attachments && message.attachments.length > 0 && (
            <div className={`space-y-2 ${message.text ? 'mt-2' : ''}`}>
              {message.attachments.map(renderAttachment)}
            </div>
          )}
        </div>
        
        <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
          isOwn ? 'flex-row-reverse' : 'flex-row'
        }`}>
          <span>{formatTime(message.date_created)}</span>
          {renderStatusIcon()}
          
          {message.status === 'failed' && onRetry && (
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
        
        {message.error && (
          <div className="text-xs text-red-500 mt-1 max-w-xs">
            {message.error}
          </div>
        )}
      </div>
    </div>
  );
}