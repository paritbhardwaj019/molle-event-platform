"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X, File, Image, FileText } from "lucide-react";
import { toast } from "sonner";
import type { ChatAttachment } from "@/types/chat";

// Helper function to get file icon based on type
const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) {
    return <Image className="h-4 w-4" />;
  } else if (type === "application/pdf") {
    return <FileText className="h-4 w-4" />;
  } else {
    return <File className="h-4 w-4" />;
  }
};

// Helper function to format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

interface AttachmentUploadProps {
  onAttachmentUpload: (attachment: ChatAttachment) => void;
  disabled?: boolean;
}

export function AttachmentUpload({
  onAttachmentUpload,
  disabled = false,
}: AttachmentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size too large. Maximum size is 10MB.");
      return;
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("File type not allowed");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/messages/user-host/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      onAttachmentUpload(data.attachment);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept="image/*,.pdf,.txt,.doc,.docx"
        className="hidden"
        disabled={disabled || uploading}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled || uploading}
        onClick={() => fileInputRef.current?.click()}
        className="h-10 w-10 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
      >
        {uploading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Paperclip className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}

interface AttachmentDisplayProps {
  attachment: ChatAttachment;
  onRemove?: () => void;
}

export function AttachmentDisplay({
  attachment,
  onRemove,
}: AttachmentDisplayProps) {
  const isImage = attachment.type.startsWith("image/");

  return (
    <div className="flex items-center space-x-2 p-2 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex-shrink-0">
        {isImage ? (
          <img
            src={attachment.url}
            alt={attachment.name}
            className="h-12 w-12 object-cover rounded"
          />
        ) : (
          <div className="h-12 w-12 bg-gray-700 rounded flex items-center justify-center">
            {getFileIcon(attachment.type)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{attachment.name}</p>
        <p className="text-xs text-gray-400">
          {formatFileSize(attachment.size)}
        </p>
      </div>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
