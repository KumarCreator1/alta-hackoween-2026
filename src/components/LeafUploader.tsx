'use client';

import { useCallback, useState } from 'react';

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

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
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`glass-card p-4 cursor-pointer transition-all duration-200 text-center
                  border-dashed !border-2 ${
                    isDragging
                      ? '!border-amber-500/50 bg-amber-500/5'
                      : '!border-white/10 hover:!border-white/20'
                  }`}
    >
      {isUploading ? (
        <div className="flex items-center justify-center gap-2 py-2">
          <svg className="animate-spin h-4 w-4 text-cyan-400" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-[11px] text-cyan-400 font-mono">Analyzing with Gemini AI...</span>
        </div>
      ) : (
        <div className="py-1">
          <span className="text-xl block mb-1">🍂</span>
          <span className="text-[11px] text-gray-400">
            Drop Leaf Image for AI Analysis
          </span>
          <span className="block text-[9px] text-gray-600 mt-0.5">
            Click or drag &amp; drop
          </span>
        </div>
      )}
    </div>
  );
}
