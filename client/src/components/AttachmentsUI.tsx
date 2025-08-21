import React from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Paperclip, FileText, Loader2 } from 'lucide-react';
import type { MessageAttachment } from '@/types';

// File attachment component for composer
interface ComposerAttachmentsProps {
  files: Array<{id: number, name: string, size: number, file_url?: string, content_type?: string}>;
  onRemove: (fileId: number) => void;
}

export function ComposerAttachments({ files, onRemove }: ComposerAttachmentsProps) {
  if (files.length === 0) return null;

  return (
    <div className="border-t p-2 space-y-2">
      {files.map((file) => (
        <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(file.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

// Add attachment button for composer
interface ComposerAddAttachmentProps {
  onSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  fileInputRef?: React.RefObject<HTMLInputElement>;
}

export function ComposerAddAttachment({ onSelect, disabled, fileInputRef }: ComposerAddAttachmentProps) {
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={onSelect}
        className="hidden"
        accept="image/*,application/pdf,.doc,.docx,.txt"
      />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={() => fileInputRef?.current?.click()}
      >
        <Paperclip className="h-4 w-4" />
      </Button>
    </>
  );
}

// File upload progress display
interface UploadProgressProps {
  uploads: Array<{name: string, progress: number, abort?: () => void}>;
  onCancel: (index: number) => void;
}

export function UploadProgress({ uploads, onCancel }: UploadProgressProps) {
  if (uploads.length === 0) return null;

  return (
    <div className="border-t p-2 space-y-2">
      {uploads.map((upload, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
          <div className="flex-1 mr-2">
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <p className="text-xs font-medium truncate">{upload.name}</p>
            </div>
            <Progress value={upload.progress} className="h-1" />
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onCancel(index)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

// Display attachments in messages
interface UserMessageAttachmentsProps {
  attachments: MessageAttachment[];
  onDownload?: (attachment: MessageAttachment) => void;
}

export function UserMessageAttachments({ attachments, onDownload }: UserMessageAttachmentsProps) {
  if (!attachments || attachments.length === 0) return null;

  const handleDownload = (attachment: MessageAttachment) => {
    if (attachment.file_url) {
      window.open(attachment.file_url, '_blank');
    }
    onDownload?.(attachment);
  };

  return (
    <div className="space-y-2 mt-2">
      {attachments.map((attachment) => {
        const isImage = attachment.content_type?.startsWith('image/');
        
        if (isImage && attachment.file_url) {
          return (
            <img
              key={attachment.id}
              src={attachment.file_url}
              alt={attachment.file_name}
              className="max-w-xs max-h-64 rounded-lg object-cover cursor-pointer"
              onClick={() => handleDownload(attachment)}
            />
          );
        }
        
        return (
          <div
            key={attachment.id}
            className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => handleDownload(attachment)}
          >
            <FileText className="h-4 w-4 text-gray-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.file_name}</p>
              {attachment.size && (
                <p className="text-xs text-gray-500">
                  {(attachment.size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}