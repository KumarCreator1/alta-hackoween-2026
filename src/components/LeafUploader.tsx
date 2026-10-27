'use client';

import React, { useCallback, useState } from 'react';

interface LeafUploaderProps {
  onUpload: (base64: string) => Promise<void>;
}

export default function LeafUploader({ onUpload }: LeafUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      setIsUploading(true);
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        await onUpload(base64);
      } catch (err) {
        console.error('Upload failed:', err);
      } finally {
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
      className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
        isDragging
          ? 'border-emerald-600 bg-emerald-50/50 scale-[0.99]'
          : 'border-gray-200 hover:border-emerald-600/50 hover:bg-gray-50/50'
      }`}
    >
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-2xl">🍂</span>
        <div className="text-xs font-bold text-gray-800">
          {isUploading ? 'Analyzing Disease via Gemini...' : 'Drop Leaf Image for AI Analysis'}
        </div>
        <p className="text-[11px] text-gray-500 max-w-xs">
          Drag & drop leaf photo or click to browse. Gemini 3.8 Flash detects lesions and drafts spray reallocations.
        </p>
      </div>
    </div>
  );
}
