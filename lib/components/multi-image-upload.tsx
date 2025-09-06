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

export interface CloudinaryImage {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  uploadedAt: string;
  order?: number;
}

interface MultiImageUploadProps {
  images: CloudinaryImage[];
  onImagesChange: (images: CloudinaryImage[]) => void;
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

interface SortableImageItemProps {
  image: CloudinaryImage;
  index: number;
  onRemove: (index: number) => void;
  isFirst: boolean;
}

function SortableImageItem({
  image,
  index,
  onRemove,
  isFirst,
}: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.publicId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-purple-400 transition-all duration-200",
        isDragging && "opacity-50 z-50",
        isFirst ? "aspect-video" : "aspect-square"
      )}
    >
      <Image
        src={image.secureUrl}
        alt="Event image"
        fill
        className="object-cover"
      />

      {/* Primary image badge */}
      {isFirst && (
        <div className="absolute top-3 left-3 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium">
          Primary
        </div>
      )}

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

      {/* Image info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-white text-xs">
          {(image.bytes / 1024 / 1024).toFixed(1)}MB • {image.width}×
          {image.height}
        </p>
      </div>
    </div>
  );
}

export function MultiImageUpload({
  images,
  onImagesChange,
  className,
  maxImages = 10,
  cloudinaryConfig,
  uploadOptions = {},
}: MultiImageUploadProps) {
  const [uploadStates, setUploadStates] = useState<ImageUploadState[]>([]);
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

      if (images.length + files.length > maxImages) {
        setGlobalError(`Maximum ${maxImages} images allowed`);
        setTimeout(() => setGlobalError(null), 5000);
        return;
      }

      const newUploadStates: ImageUploadState[] = files.map((file) => ({
        file,
        progress: 0,
        status: "uploading" as const,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
      }));

      setUploadStates((prev) => [...prev, ...newUploadStates]);

      // Upload files in parallel
      const uploadPromises = files.map(async (file, fileIndex) => {
        const validation = validateImageFile(file, {
          maxSize: 5 * 1024 * 1024, // 5MB
          allowedTypes: ["image/jpeg", "image/jpg", "image/png"],
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

          const cloudinaryImage: CloudinaryImage = {
            publicId: response.public_id,
            secureUrl: response.secure_url,
            width: response.width,
            height: response.height,
            bytes: response.bytes,
            format: response.format,
            uploadedAt: response.created_at,
            order: images.length + fileIndex,
          };

          return cloudinaryImage;
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
        const uploadedImages = await Promise.all(uploadPromises);
        const validImages = uploadedImages.filter(
          (img): img is CloudinaryImage => img !== null
        );

        if (validImages.length > 0) {
          onImagesChange([...images, ...validImages]);
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
    [images, onImagesChange, cloudinary, uploadOptions, maxImages]
  );

  const handleRemoveImage = useCallback(
    (index: number) => {
      const newImages = images.filter((_, i) => i !== index);
      // Reorder remaining images
      const reorderedImages = newImages.map(
        (img: CloudinaryImage, i: number) => ({ ...img, order: i })
      );
      onImagesChange(reorderedImages);
    },
    [images, onImagesChange]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = images.findIndex((img) => img.publicId === active.id);
        const newIndex = images.findIndex((img) => img.publicId === over.id);

        const reorderedImages = arrayMove(images, oldIndex, newIndex).map(
          (img: CloudinaryImage, i: number) => ({
            ...img,
            order: i,
          })
        );

        onImagesChange(reorderedImages);
      }
    },
    [images, onImagesChange]
  );

  const canAddMore = images.length + uploadStates.length < maxImages;

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
          <label htmlFor="multi-image-upload" className="cursor-pointer block">
            <div className="py-8 flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Plus className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-lg font-medium text-gray-700 mb-1">
                  {images.length === 0
                    ? "Upload Event Images"
                    : "Add More Images"}
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG up to 5MB each • {images.length}/{maxImages} images
                </p>
              </div>
            </div>
          </label>
          <input
            id="multi-image-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
        </div>
      )}

      {/* Upload Progress */}
      {uploadStates.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Uploading...</h4>
          {uploadStates.map((uploadState) => (
            <div
              key={uploadState.id}
              className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <div className="relative w-16 h-16 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
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
          ))}
        </div>
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Event Images ({images.length})
            </h4>
            <p className="text-xs text-gray-500">
              Drag to reorder • First image will be the cover
            </p>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((img) => img.publicId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <SortableImageItem
                    key={image.publicId}
                    image={image}
                    index={index}
                    onRemove={handleRemoveImage}
                    isFirst={index === 0}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {images.length === 0 && uploadStates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}
