"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface KycImageUploadProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  placeholder?: string;
}

export function KycImageUpload({
  onUpload,
  disabled = false,
  loading = false,
  className,
  placeholder = "Click to upload image",
}: KycImageUploadProps) {
  const [uploadState, setUploadState] = useState<{
    file: File;
    progress: number;
    status: "uploading" | "completed" | "error";
    error?: string;
  } | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const validateFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return "File type not supported. Please upload JPG, PNG, or WebP files.";
    }

    if (file.size > maxSize) {
      return "File size too large. Please upload files smaller than 10MB.";
    }

    return null;
  };

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validationError = validateFile(file);
      if (validationError) {
        setGlobalError(validationError);
        setTimeout(() => setGlobalError(null), 5000);
        return;
      }

      setUploadState({
        file,
        progress: 0,
        status: "uploading",
      });

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadState((prev) => {
          if (!prev) return prev;
          const newProgress = Math.min(prev.progress + 10, 90);
          return { ...prev, progress: newProgress };
        });
      }, 100);

      try {
        // Call the onUpload callback
        await onUpload(file);

        // Mark as completed
        setUploadState((prev) => {
          if (!prev) return prev;
          return { ...prev, progress: 100, status: "completed" };
        });
      } catch (error) {
        setUploadState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: "error",
            error: error instanceof Error ? error.message : "Upload failed",
          };
        });
        setGlobalError("Upload failed. Please try again.");
        setTimeout(() => setGlobalError(null), 5000);
      } finally {
        clearInterval(interval);
      }
    },
    [onUpload]
  );

  const handleRemoveImage = useCallback(() => {
    setUploadState(null);
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {globalError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {globalError}
          </AlertDescription>
        </Alert>
      )}

      {!uploadState && (
        <div className="space-y-4">
          <label
            htmlFor="kyc-image-upload"
            className={cn(
              "cursor-pointer",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <div className="py-6 flex items-center justify-center w-full h-32 border-1 border-dashed border-black/10 rounded-lg hover:border-purple-400 hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">
                  {placeholder}
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG, WebP up to 10MB
                </p>
              </div>
            </div>
          </label>
          <input
            id="kyc-image-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
        </div>
      )}

      {uploadState && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="relative w-20 h-20 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
            <Image
              src={URL.createObjectURL(uploadState.file)}
              alt="Uploading"
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {uploadState.file.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {uploadState.status === "uploading" && (
                <>
                  <Progress
                    value={uploadState.progress}
                    className="flex-1 h-2"
                  />
                  <span className="text-xs text-gray-500">
                    {uploadState.progress}%
                  </span>
                </>
              )}
              {uploadState.status === "completed" && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Uploaded successfully</span>
                </div>
              )}
              {uploadState.status === "error" && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs">{uploadState.error}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {uploadState.status === "uploading" && (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            )}
            {uploadState.status === "completed" && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {uploadState.status === "error" && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRemoveImage}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
