"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  CloudinaryUploader,
  CloudinaryResponse,
  UploadProgress,
  validateImageFile,
  createCloudinaryUploader,
} from "@/lib/cloudinary";

interface CloudinaryImage {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  uploadedAt: string;
}

interface ImageUploadProps {
  images: CloudinaryImage[];
  onImagesChange: (images: CloudinaryImage[]) => void;
  className?: string;
  cloudinaryConfig: {
    cloudName: string;
    uploadPreset: string;
    folder?: string;
  };
  uploadOptions?: {
    quality?: string | number;
  };
}

interface ImageUploadState {
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
  cloudinaryResponse?: CloudinaryResponse;
  id: string;
}

export function ImageUpload({
  images,
  onImagesChange,
  className,
  cloudinaryConfig,
  uploadOptions = {},
}: ImageUploadProps) {
  const [uploadState, setUploadState] = useState<ImageUploadState | null>(null);
  const [cloudinary] = useState(() =>
    createCloudinaryUploader({
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
      uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
      folder: process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER!,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      apiSecret: process.env.CLOUDINARY_API_SECRET!,
    })
  );
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validation = validateImageFile(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ["image/jpeg", "image/jpg", "image/png"],
      });

      if (!validation.valid) {
        setGlobalError(validation.error || "Invalid file");
        setTimeout(() => setGlobalError(null), 5000);
        return;
      }

      const newUploadState: ImageUploadState = {
        file,
        progress: 0,
        status: "uploading",
        id: `${file.name}-${Date.now()}`,
      };

      setUploadState(newUploadState);

      try {
        const response = await cloudinary.uploadFile(file, {
          ...uploadOptions,
          onProgress: (progress: UploadProgress) => {
            setUploadState((prev) =>
              prev?.id === newUploadState.id
                ? { ...prev, progress: progress.percentage }
                : prev
            );
          },
        });

        setUploadState((prev) =>
          prev?.id === newUploadState.id
            ? {
                ...prev,
                status: "completed",
                cloudinaryResponse: response,
              }
            : prev
        );

        const cloudinaryImage: CloudinaryImage = {
          publicId: response.public_id,
          secureUrl: response.secure_url,
          width: response.width,
          height: response.height,
          bytes: response.bytes,
          format: response.format,
          uploadedAt: response.created_at,
        };

        onImagesChange([cloudinaryImage]);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        setUploadState((prev) =>
          prev?.id === newUploadState.id
            ? { ...prev, status: "error", error: errorMessage }
            : prev
        );
        setGlobalError(errorMessage);
        setTimeout(() => setGlobalError(null), 5000);
      }

      e.target.value = "";
    },
    [onImagesChange, cloudinary, uploadOptions]
  );

  const handleRemoveImage = useCallback(() => {
    onImagesChange([]);
    setUploadState(null);
  }, [onImagesChange]);

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

      {(!images || !images.length) && !uploadState && (
        <div className="space-y-4">
          <label htmlFor="image-upload" className={cn("cursor-pointer")}>
            <div className="py-6 flex items-center justify-center w-full h-32 border-1 border-dashed border-black/10 rounded-lg hover:border-purple-400 hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">
                  Click to upload cover image
                </p>
                <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
              </div>
            </div>
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {uploadState && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="relative w-20 h-20 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
            {uploadState.file && (
              <Image
                src={URL.createObjectURL(uploadState.file)}
                alt="Uploading"
                fill
                className="object-cover"
              />
            )}
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

          <div className="flex items-center">
            {uploadState.status === "uploading" && (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            )}
            {uploadState.status === "completed" && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {uploadState.status === "error" && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
        </div>
      )}

      {images && images.length > 0 && (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden">
          <Image
            src={images[0].secureUrl}
            alt="Cover image"
            fill
            className="object-cover"
          />
          <Button
            size="sm"
            variant="destructive"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
