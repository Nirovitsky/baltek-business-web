import { useRef, useState } from "react";
import { Paperclip, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AttachmentPreview from "./AttachmentPreview";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onRemoveFile: () => void;
  disabled?: boolean;
}

export default function FileUpload({ 
  onFileSelect, 
  selectedFile, 
  onRemoveFile, 
  disabled = false 
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav'
  ];

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return false;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "File type not supported",
        description: "Please select an image, document, video, or audio file",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {selectedFile ? (
        <div className="mb-3">
          <AttachmentPreview
            attachment={{
              url: URL.createObjectURL(selectedFile),
              name: selectedFile.name,
              type: selectedFile.type,
              size: selectedFile.size,
            }}
            onRemove={onRemoveFile}
            showRemove={true}
          />
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            dragOver
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/30 hover:border-muted-foreground/50'
          }`}
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop a file here, or click to select
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleButtonClick}
            disabled={disabled}
            className="text-xs"
          >
            <Paperclip className="w-3 h-3 mr-1" />
            Choose File
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Max 10MB • Images, Documents, Videos, Audio
          </p>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={handleButtonClick}
        disabled={disabled}
        className="absolute bottom-0 right-0 w-8 h-8 p-0"
        title="Attach file"
      >
        <Paperclip className="w-4 h-4" />
      </Button>
    </div>
  );
}