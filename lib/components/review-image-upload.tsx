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
  Plus,
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

export interface ReviewImage {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  uploadedAt: string;
  type: "image";
  order?: number;
}

interface ReviewImageUploadProps {
  images: ReviewImage[];
  onImagesChange: (images: ReviewImage[]) => void;
  className?: string;
  maxImages?: number;
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

export function ReviewImageUpload({
  images,
  onImagesChange,
  className,
  maxImages = 3,
  cloudinaryConfig,
  uploadOptions = {},
}: ReviewImageUploadProps) {
  const [uploadStates, setUploadStates] = useState<ImageUploadState[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const uploader = createCloudinaryUploader(cloudinaryConfig);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);
      const remainingSlots = maxImages - images.length;

      if (fileArray.length > remainingSlots) {
        alert(`You can only upload ${remainingSlots} more image(s)`);
        return;
      }

      const newUploadStates: ImageUploadState[] = fileArray.map((file) => ({
        file,
        progress: 0,
        status: "uploading",
        id: Math.random().toString(36).substr(2, 9),
      }));

      setUploadStates((prev) => [...prev, ...newUploadStates]);

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const uploadState = newUploadStates[i];

        // Validate file
        const validation = validateImageFile(file, {
          maxSize: 10 * 1024 * 1024, // 10MB
          allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
        });

        if (!validation.valid) {
          setUploadStates((prev) =>
            prev.map((state) =>
              state.id === uploadState.id
                ? { ...state, status: "error", error: validation.error }
                : state
            )
          );
          continue;
        }

        try {
          const response = await uploader.uploadFile(file, {
            ...uploadOptions,
            folder: cloudinaryConfig.folder || "review-images",
            onProgress: (progress) => {
              setUploadStates((prev) =>
                prev.map((state) =>
                  state.id === uploadState.id
                    ? { ...state, progress: progress.percentage }
                    : state
                )
              );
            },
          });

          const newImage: ReviewImage = {
            publicId: response.public_id,
            secureUrl: response.secure_url,
            width: response.width,
            height: response.height,
            bytes: response.bytes,
            format: response.format,
            uploadedAt: response.created_at,
            type: "image",
            order: images.length + i,
          };

          onImagesChange([...images, newImage]);

          setUploadStates((prev) =>
            prev.map((state) =>
              state.id === uploadState.id
                ? {
                    ...state,
                    status: "completed",
                    cloudinaryResponse: response,
                  }
                : state
            )
          );
        } catch (error) {
          console.error("Upload error:", error);
          setUploadStates((prev) =>
            prev.map((state) =>
              state.id === uploadState.id
                ? {
                    ...state,
                    status: "error",
                    error: "Failed to upload image",
                  }
                : state
            )
          );
        }
      }

      // Clean up completed uploads after a delay
      setTimeout(() => {
        setUploadStates((prev) =>
          prev.filter((state) => state.status === "uploading")
        );
      }, 3000);
    },
    [
      images,
      maxImages,
      onImagesChange,
      uploader,
      uploadOptions,
      cloudinaryConfig.folder,
    ]
  );

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    e.target.value = ""; // Reset input
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            isDragging
              ? "border-purple-400 bg-purple-50"
              : "border-gray-300 hover:border-gray-400"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            id="review-image-upload"
          />
          <label
            htmlFor="review-image-upload"
            className="cursor-pointer flex flex-col items-center space-y-2"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Click to upload images
              </p>
              <p className="text-xs text-gray-500">
                or drag and drop up to {maxImages - images.length} image(s)
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG, WebP up to 10MB each
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Upload Progress */}
      {uploadStates.map((uploadState) => (
        <div key={uploadState.id} className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">
              {uploadState.file.name}
            </span>
            {uploadState.status === "uploading" && (
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            )}
            {uploadState.status === "completed" && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            {uploadState.status === "error" && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>

          {uploadState.status === "uploading" && (
            <Progress value={uploadState.progress} className="h-2" />
          )}

          {uploadState.status === "error" && (
            <Alert variant="destructive">
              <AlertDescription>{uploadState.error}</AlertDescription>
            </Alert>
          )}
        </div>
      ))}

      {/* Uploaded Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div
              key={image.publicId}
              className="relative group rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-purple-400 transition-all duration-200 aspect-square"
            >
              <Image
                src={image.secureUrl}
                alt={`Review image ${index + 1}`}
                fill
                className="object-cover"
              />

              {/* Remove button */}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </Button>

              {/* Image info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs">
                  {(image.bytes / 1024 / 1024).toFixed(1)}MB • {image.width}×
                  {image.height}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
