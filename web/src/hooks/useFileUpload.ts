import { useState, useRef } from "react";

export interface FileUploadOptions<T = unknown> {
  onUploadStart?: () => void;
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (result: T[]) => void;
  onUploadError?: (error: string) => void;
  uploadFile: (file: File) => Promise<T>;
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
}

export function useFileUpload<T = unknown>({
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  uploadFile,
  maxFiles = 20,
}: FileUploadOptions<T>) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles = selectedFiles.slice(0, maxFiles - files.length);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setFiles([]);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    onUploadStart?.();

    try {
      const results: T[] = [];
      for (let i = 0; i < files.length; i++) {
        const result = await uploadFile(files[i]);
        results.push(result);
        const progress = Math.round(((i + 1) / files.length) * 100);
        setUploadProgress(progress);
        onUploadProgress?.(progress);
      }

      onUploadComplete?.(results);
      setFiles([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "上传失败";
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return {
    files,
    isUploading,
    uploadProgress,
    fileInputRef,
    handleFileSelect,
    removeFile,
    clearFiles,
    triggerFileSelect,
    handleUpload,
  };
}
