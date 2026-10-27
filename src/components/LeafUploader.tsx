'use client';

import { useState, useCallback } from 'react';
import { UploadCloud } from 'lucide-react';

interface LeafUploaderProps {
  onUpload: (base64: string) => Promise<void>;
}

export default function LeafUploader({ onUpload }: LeafUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG)');
        return;
      }

      setIsUploading(true);
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          await onUpload(base64);
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error('File upload failed:', err);
        setIsUploading(false);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  }, [handleFile]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onClick={handleClick}
      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
        isDragging
          ? 'border-stone-800 bg-stone-100'
          : 'border-stone-300 hover:border-stone-500 hover:bg-stone-50'
      }`}
    >
      <div className="flex flex-col items-center gap-1.5">
        <UploadCloud className="w-6 h-6 text-stone-600" />
        <div className="text-xs font-bold text-stone-900">
          {isUploading ? 'Analyzing Foliage Lesions via Vision...' : 'Upload Crop Leaf Image for Pathology Assay'}
        </div>
        <p className="text-[11px] text-stone-500 max-w-xs">
          Select or drag leaf photo to identify crop disease (late blight, powdery mildew) and trigger spray reallocations.
        </p>
      </div>
    </div>
  );
}
