"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Loader2, X, Plus, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { createCloudinaryUploader, validateImageFile } from "@/lib/cloudinary";
import Image from "next/image";

interface ProfilePhotosUploadProps {
  currentPhotos: string[];
  onPhotosChange: (photos: string[]) => void;
  disabled?: boolean;
  maxPhotos?: number;
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

export function ProfilePhotosUpload({
  currentPhotos = [],
  onPhotosChange,
  disabled = false,
  maxPhotos = 6,
}: ProfilePhotosUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Create cloudinary config
  const cloudinaryConfig = {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
    folder: "profile-photos",
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

      if (currentPhotos.length >= maxPhotos) {
        toast.error(`Maximum ${maxPhotos} photos allowed`);
        return;
      }

      // Validate file
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

        onPhotosChange([...currentPhotos, cloudinaryImage.secureUrl]);
        toast.success("Photo uploaded successfully!");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload photo. Please try again.");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [cloudinary, onPhotosChange, currentPhotos, maxPhotos]
  );

  const handleRemovePhoto = useCallback(
    (index: number) => {
      const newPhotos = currentPhotos.filter((_, i) => i !== index);
      onPhotosChange(newPhotos);
      toast.success("Photo removed");
    },
    [currentPhotos, onPhotosChange]
  );

  const handleReorderPhotos = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newPhotos = [...currentPhotos];
      const [movedPhoto] = newPhotos.splice(fromIndex, 1);
      newPhotos.splice(toIndex, 0, movedPhoto);
      onPhotosChange(newPhotos);
    },
    [currentPhotos, onPhotosChange]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Profile Photos</h3>
        <span className="text-sm text-gray-500">
          {currentPhotos.length}/{maxPhotos}
        </span>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {currentPhotos.map((photo, index) => (
          <Card key={index} className="relative group">
            <CardContent className="p-0">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
                <Image
                  src={photo}
                  alt={`Profile photo ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />

                {/* Remove button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemovePhoto(index)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Photo number */}
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Upload button */}
        {currentPhotos.length < maxPhotos && (
          <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
            <CardContent className="p-0">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="profile-photos-upload"
                  disabled={disabled || isUploading}
                />
                <label
                  htmlFor="profile-photos-upload"
                  className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  {isUploading ? (
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">Uploading...</p>
                      {uploadProgress > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                          <div
                            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <Plus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">Add Photo</p>
                    </div>
                  )}
                </label>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload progress */}
      {isUploading && uploadProgress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      <p className="text-xs text-gray-500">
        Upload up to {maxPhotos} photos. JPG, PNG or GIF. Max 5MB each.
      </p>
    </div>
  );
}
