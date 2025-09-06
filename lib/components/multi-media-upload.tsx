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
  GripVertical,
  Plus,
  Video,
  PlayCircle,
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface CloudinaryMedia {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  uploadedAt: string;
  type: "image" | "video";
  duration?: number; // For videos
  order?: number;
}

interface MultiMediaUploadProps {
  media: CloudinaryMedia[];
  onMediaChange: (media: CloudinaryMedia[]) => void;
  className?: string;
  maxMedia?: number;
  cloudinaryConfig: {
    cloudName: string;
    uploadPreset: string;
    folder?: string;
  };
  uploadOptions?: {
    quality?: string | number;
  };
}

interface MediaUploadState {
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
  cloudinaryResponse?: CloudinaryResponse;
  id: string;
  type: "image" | "video";
}

interface SortableMediaItemProps {
  media: CloudinaryMedia;
  index: number;
  onRemove: (index: number) => void;
}

function SortableMediaItem({ media, index, onRemove }: SortableMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: media.publicId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-purple-400 transition-all duration-200 aspect-square",
        isDragging && "opacity-50 z-50"
      )}
    >
      {media.type === "image" ? (
        <Image
          src={media.secureUrl}
          alt="Review media"
          fill
          className="object-cover"
        />
      ) : (
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          <video
            src={media.secureUrl}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <PlayCircle className="w-12 h-12 text-white" />
          </div>
        </div>
      )}

      {/* Media type badge */}
      <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full font-medium">
        {media.type === "image" ? "Image" : "Video"}
      </div>

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 right-12 bg-black/60 text-white p-1.5 rounded-lg cursor-grab hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Remove button */}
      <Button
        size="sm"
        variant="destructive"
        onClick={() => onRemove(index)}
        className="absolute top-3 right-3 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </Button>

      {/* Media info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-white text-xs">
          {(media.bytes / 1024 / 1024).toFixed(1)}MB • {media.width}×
          {media.height}
          {media.type === "video" && media.duration && (
            <> • {Math.round(media.duration)}s</>
          )}
        </p>
      </div>
    </div>
  );
}

// Validate media file
function validateMediaFile(
  file: File,
  options: {
    maxSize: number;
    allowedImageTypes: string[];
    allowedVideoTypes: string[];
  }
) {
  const { maxSize, allowedImageTypes, allowedVideoTypes } = options;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${maxSize / 1024 / 1024}MB`,
    };
  }

  const isImage = allowedImageTypes.includes(file.type);
  const isVideo = allowedVideoTypes.includes(file.type);

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: "File must be an image (JPG, PNG) or video (MP4, MOV)",
    };
  }

  return { valid: true, type: isImage ? "image" : ("video" as const) };
}

export function MultiMediaUpload({
  media,
  onMediaChange,
  className,
  maxMedia = 3,
  cloudinaryConfig,
  uploadOptions = {},
}: MultiMediaUploadProps) {
  const [uploadStates, setUploadStates] = useState<MediaUploadState[]>([]);
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      if (media.length + files.length > maxMedia) {
        setGlobalError(`Maximum ${maxMedia} media files allowed`);
        setTimeout(() => setGlobalError(null), 5000);
        return;
      }

      const newUploadStates: MediaUploadState[] = files.map((file) => {
        const validation = validateMediaFile(file, {
          maxSize: 50 * 1024 * 1024, // 50MB for videos, will be validated per type
          allowedImageTypes: ["image/jpeg", "image/jpg", "image/png"],
          allowedVideoTypes: ["video/mp4", "video/mov", "video/avi"],
        });

        return {
          file,
          progress: 0,
          status: "uploading" as const,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          type: (validation.type || "image") as "image" | "video",
        };
      });

      setUploadStates((prev) => [...prev, ...newUploadStates]);

      // Upload files in parallel
      const uploadPromises = files.map(async (file, fileIndex) => {
        const validation = validateMediaFile(file, {
          maxSize: file.type.startsWith("video/")
            ? 50 * 1024 * 1024
            : 5 * 1024 * 1024, // 50MB for videos, 5MB for images
          allowedImageTypes: ["image/jpeg", "image/jpg", "image/png"],
          allowedVideoTypes: ["video/mp4", "video/mov", "video/avi"],
        });

        const uploadStateId = newUploadStates[fileIndex].id;

        if (!validation.valid) {
          setUploadStates((prev) =>
            prev.map((state) =>
              state.id === uploadStateId
                ? {
                    ...state,
                    status: "error",
                    error: validation.error || "Invalid file",
                  }
                : state
            )
          );
          return null;
        }

        try {
          const response = await cloudinary.uploadFile(file, {
            ...uploadOptions,
            onProgress: (progress: UploadProgress) => {
              setUploadStates((prev) =>
                prev.map((state) =>
                  state.id === uploadStateId
                    ? { ...state, progress: progress.percentage }
                    : state
                )
              );
            },
          });

          setUploadStates((prev) =>
            prev.map((state) =>
              state.id === uploadStateId
                ? {
                    ...state,
                    status: "completed",
                    cloudinaryResponse: response,
                  }
                : state
            )
          );

          const cloudinaryMedia: CloudinaryMedia = {
            publicId: response.public_id,
            secureUrl: response.secure_url,
            width: response.width,
            height: response.height,
            bytes: response.bytes,
            format: response.format,
            uploadedAt: response.created_at,
            type: validation.type! as "image" | "video",
            duration: (response as any).duration, // For videos
            order: media.length + fileIndex,
          };

          return cloudinaryMedia;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Upload failed";
          setUploadStates((prev) =>
            prev.map((state) =>
              state.id === uploadStateId
                ? { ...state, status: "error", error: errorMessage }
                : state
            )
          );
          return null;
        }
      });

      try {
        const uploadedMedia = await Promise.all(uploadPromises);
        const validMedia = uploadedMedia.filter(
          (media): media is CloudinaryMedia => media !== null
        );

        if (validMedia.length > 0) {
          onMediaChange([...media, ...validMedia]);
        }
      } catch (error) {
        console.error("Upload error:", error);
        setGlobalError("Some uploads failed");
        setTimeout(() => setGlobalError(null), 5000);
      } finally {
        // Clear completed upload states after a delay
        setTimeout(() => {
          setUploadStates((prev) =>
            prev.filter((state) => state.status === "uploading")
          );
        }, 2000);
      }

      e.target.value = "";
    },
    [media, onMediaChange, cloudinary, uploadOptions, maxMedia]
  );

  const handleRemoveMedia = useCallback(
    (index: number) => {
      const newMedia = media.filter((_, i) => i !== index);
      // Reorder remaining media
      const reorderedMedia = newMedia.map(
        (mediaItem: CloudinaryMedia, i: number) => ({ ...mediaItem, order: i })
      );
      onMediaChange(reorderedMedia);
    },
    [media, onMediaChange]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = media.findIndex(
          (mediaItem) => mediaItem.publicId === active.id
        );
        const newIndex = media.findIndex(
          (mediaItem) => mediaItem.publicId === over.id
        );

        const reorderedMedia = arrayMove(media, oldIndex, newIndex).map(
          (mediaItem: CloudinaryMedia, i: number) => ({
            ...mediaItem,
            order: i,
          })
        );

        onMediaChange(reorderedMedia);
      }
    },
    [media, onMediaChange]
  );

  const canAddMore = media.length + uploadStates.length < maxMedia;

  return (
    <div className={cn("space-y-6", className)}>
      {globalError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {globalError}
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      {canAddMore && (
        <div className="space-y-4">
          <label htmlFor="multi-media-upload" className="cursor-pointer block">
            <div className="py-8 flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-600 rounded-xl hover:border-purple-400 hover:bg-gray-800/50 transition-colors">
              <div className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Plus className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-lg font-medium text-gray-300 mb-1">
                  {media.length === 0
                    ? "Upload Photos or Videos"
                    : "Add More Media"}
                </p>
                <p className="text-sm text-gray-400">
                  Images (PNG, JPG up to 5MB) • Videos (MP4, MOV up to 50MB) •{" "}
                  {media.length}/{maxMedia} files
                </p>
              </div>
            </div>
          </label>
          <input
            id="multi-media-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png,video/mp4,video/mov,video/avi"
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
        </div>
      )}

      {/* Upload Progress */}
      {uploadStates.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Uploading...</h4>
          {uploadStates.map((uploadState) => (
            <div
              key={uploadState.id}
              className="flex items-center gap-4 p-3 bg-gray-800/50 border border-gray-700 rounded-lg"
            >
              <div className="relative w-16 h-16 flex-shrink-0 bg-gray-700 rounded-lg overflow-hidden">
                {uploadState.type === "image" ? (
                  <Image
                    src={URL.createObjectURL(uploadState.file)}
                    alt="Uploading"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">
                  {uploadState.file.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {uploadState.status === "uploading" && (
                    <>
                      <Progress
                        value={uploadState.progress}
                        className="flex-1 h-2"
                      />
                      <span className="text-xs text-gray-400">
                        {uploadState.progress}%
                      </span>
                    </>
                  )}
                  {uploadState.status === "completed" && (
                    <div className="flex items-center gap-1 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs">Uploaded successfully</span>
                    </div>
                  )}
                  {uploadState.status === "error" && (
                    <div className="flex items-center gap-1 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs">{uploadState.error}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                {uploadState.status === "uploading" && (
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                )}
                {uploadState.status === "completed" && (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
                {uploadState.status === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Gallery */}
      {media.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-300">
              Review Media ({media.length})
            </h4>
            <p className="text-xs text-gray-400">Drag to reorder</p>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={media.map((mediaItem) => mediaItem.publicId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {media.map((mediaItem, index) => (
                  <SortableMediaItem
                    key={mediaItem.publicId}
                    media={mediaItem}
                    index={index}
                    onRemove={handleRemoveMedia}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {media.length === 0 && uploadStates.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-500" />
          <p>No media uploaded yet</p>
        </div>
      )}
    </div>
  );
}
