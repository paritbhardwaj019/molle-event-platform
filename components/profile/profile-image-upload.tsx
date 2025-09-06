"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createCloudinaryUploader, validateImageFile } from "@/lib/cloudinary";

interface ProfileImageUploadProps {
  currentImage?: string | null;
  onImageChange: (imageUrl: string) => void;
  userName: string;
  disabled?: boolean;
}

interface CloudinaryImage {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  uploadedAt: string;
}

export function ProfileImageUpload({
  currentImage,
  onImageChange,
  userName,
  disabled = false,
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Create cloudinary config similar to basic-info-step.tsx
  const cloudinaryConfig = {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
    folder: "profile-avatars",
  };

  const cloudinary = createCloudinaryUploader({
    ...cloudinaryConfig,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    apiSecret: process.env.CLOUDINARY_API_SECRET!,
  });

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file using the same validation as other components
      const validation = validateImageFile(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ["image/jpeg", "image/jpg", "image/png"],
      });

      if (!validation.valid) {
        toast.error(validation.error || "Invalid file");
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const response = await cloudinary.uploadFile(file, {
          quality: "auto",
          onProgress: (progress) => {
            setUploadProgress(progress.percentage);
          },
        });

        const cloudinaryImage: CloudinaryImage = {
          publicId: response.public_id,
          secureUrl: response.secure_url,
          width: response.width,
          height: response.height,
          bytes: response.bytes,
          format: response.format,
          uploadedAt: response.created_at,
        };

        onImageChange(cloudinaryImage.secureUrl);
        toast.success("Profile image uploaded successfully!");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload image. Please try again.");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [cloudinary, onImageChange]
  );

  const handleRemoveImage = useCallback(() => {
    onImageChange("");
    toast.success("Profile image removed");
  }, [onImageChange]);

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
          <AvatarImage src={currentImage || undefined} />
          <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-[#cc18d9] to-[#e316cd] text-white">
            {userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="profile-image-upload"
            disabled={disabled || isUploading}
          />
          <label htmlFor="profile-image-upload">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isUploading}
              className="cursor-pointer"
              asChild
            >
              <span>
                <Camera className="h-4 w-4 mr-2" />
                {currentImage ? "Change Photo" : "Upload Photo"}
              </span>
            </Button>
          </label>

          {currentImage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveImage}
              disabled={disabled || isUploading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </div>

        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        <p className="text-xs text-gray-500">JPG, PNG or GIF. Max 5MB.</p>
      </div>
    </div>
  );
}
