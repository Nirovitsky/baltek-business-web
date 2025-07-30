import { useState } from "react";
import { X, Download, FileText, Image, Video, Music, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AttachmentPreviewProps {
  attachment: {
    url: string;
    name: string;
    type: string;
    size: number;
  };
  onRemove?: () => void;
  showRemove?: boolean;
}

export default function AttachmentPreview({ 
  attachment, 
  onRemove, 
  showRemove = false 
}: AttachmentPreviewProps) {
  const [imageError, setImageError] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (type.startsWith('audio/')) return <Music className="w-4 h-4" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const isImage = attachment.type.startsWith('image/') && !imageError;

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
      {showRemove && onRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md"
        >
          <X className="w-3 h-3" />
        </Button>
      )}

      <div className="flex items-start space-x-3">
        {isImage ? (
          <div className="flex-shrink-0">
            <img 
              src={attachment.url} 
              alt={attachment.name}
              className="w-16 h-16 object-cover rounded-md border border-gray-200"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center border border-gray-200">
            {getFileIcon(attachment.type)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {attachment.name}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {attachment.type.split('/')[1]?.toUpperCase() || 'FILE'}
            </Badge>
            <span className="text-xs text-gray-500">
              {formatFileSize(attachment.size)}
            </span>
          </div>
        </div>

        {!showRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const link = document.createElement('a');
              link.href = attachment.url;
              link.download = attachment.name;
              link.click();
            }}
            className="flex-shrink-0"
          >
            <Download className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}