import React from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageModal({ src, alt, isOpen, onClose }: ImageModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      {/* Portal-like overlay that breaks out of container constraints */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black backdrop-blur-sm"
        onClick={handleBackdropClick}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[10000] p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200"
          aria-label="Close image"
        >
          <X className="h-6 w-6 text-white" />
        </button>
        
        <img
          src={src}
          alt={alt}
          className="max-w-[90vw] max-h-[90vh] object-contain cursor-pointer select-none"
          onClick={onClose}
          style={{ maxWidth: '90vw', maxHeight: '90vh' }}
        />
      </div>
    </>
  );
}