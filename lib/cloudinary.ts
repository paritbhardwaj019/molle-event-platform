export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
  apiSecret?: string;
  folder?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
  created_at: string;
  folder?: string;
  version: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  transformation?: string;
  quality?: string | number;
  folder?: string;
  public_id?: string;
  tags?: string[];
  context?: Record<string, string>;
}

export class CloudinaryUploader {
  private config: CloudinaryConfig;

  constructor(config: CloudinaryConfig) {
    this.config = config;
  }

  /**
   * Upload a single file to Cloudinary
   */
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<CloudinaryResponse> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      const xhr = new XMLHttpRequest();

      formData.append("file", file);
      formData.append("upload_preset", this.config.uploadPreset);

      if (this.config.folder || options.folder) {
        formData.append("folder", options.folder || this.config.folder!);
      }

      if (options.public_id) {
        formData.append("public_id", options.public_id);
      }

      if (options.transformation) {
        formData.append("transformation", options.transformation);
      }

      if (options.quality) {
        formData.append("quality", options.quality.toString());
      }

      if (options.tags && options.tags.length > 0) {
        formData.append("tags", options.tags.join(","));
      }

      if (options.context) {
        formData.append(
          "context",
          Object.entries(options.context)
            .map(([key, value]) => `${key}=${value}`)
            .join("|")
        );
      }

      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`
      );

      if (options.onProgress) {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            };
            options.onProgress!(progress);
          }
        });
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText) as CloudinaryResponse;
            resolve(response);
          } catch (error) {
            reject(new Error("Failed to parse Cloudinary response"));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error?.message || "Upload failed"));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during upload"));
      };

      xhr.ontimeout = () => {
        reject(new Error("Upload timeout"));
      };

      // Set timeout (30 seconds)
      xhr.timeout = 30000;

      // Send request
      xhr.send(formData);
    });
  }

  /**
   * Upload multiple files with individual progress tracking
   */
  async uploadMultipleFiles(
    files: File[],
    options: UploadOptions & {
      onFileProgress?: (fileIndex: number, progress: UploadProgress) => void;
      onFileComplete?: (
        fileIndex: number,
        response: CloudinaryResponse
      ) => void;
      onFileError?: (fileIndex: number, error: Error) => void;
      concurrent?: boolean;
    } = {}
  ): Promise<CloudinaryResponse[]> {
    const {
      concurrent = false,
      onFileProgress,
      onFileComplete,
      onFileError,
      ...uploadOptions
    } = options;

    if (concurrent) {
      // Upload all files concurrently
      const uploadPromises = files.map((file, index) =>
        this.uploadFile(file, {
          ...uploadOptions,
          onProgress: onFileProgress
            ? (progress) => onFileProgress(index, progress)
            : undefined,
        })
          .then((response) => {
            if (onFileComplete) onFileComplete(index, response);
            return response;
          })
          .catch((error) => {
            if (onFileError) onFileError(index, error);
            throw error;
          })
      );

      return Promise.all(uploadPromises);
    } else {
      const results: CloudinaryResponse[] = [];

      for (let i = 0; i < files.length; i++) {
        try {
          const response = await this.uploadFile(files[i], {
            ...uploadOptions,
            onProgress: onFileProgress
              ? (progress) => onFileProgress(i, progress)
              : undefined,
          });

          results.push(response);
          if (onFileComplete) onFileComplete(i, response);
        } catch (error) {
          if (onFileError) onFileError(i, error as Error);
          throw error;
        }
      }

      return results;
    }
  }

  /**
   * Delete an image from Cloudinary (requires API key)
   */
  async deleteImage(publicId: string): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error("API key required for delete operations");
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/destroy`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_id: publicId,
          api_key: this.config.apiKey,
          timestamp: Math.round(Date.now() / 1000),
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete image");
    }
  }

  /**
   * Generate optimized image URL with transformations
   */
  generateImageUrl(
    publicId: string,
    transformations?: {
      width?: number;
      height?: number;
      crop?: "fill" | "fit" | "scale" | "crop" | "thumb" | "pad";
      quality?: string | number;
      format?: "auto" | "webp" | "jpg" | "png";
      gravity?: string;
      effect?: string;
    }
  ): string {
    let url = `https://res.cloudinary.com/${this.config.cloudName}/image/upload`;

    if (transformations) {
      const transformParts: string[] = [];

      if (transformations.width)
        transformParts.push(`w_${transformations.width}`);
      if (transformations.height)
        transformParts.push(`h_${transformations.height}`);
      if (transformations.crop)
        transformParts.push(`c_${transformations.crop}`);
      if (transformations.quality)
        transformParts.push(`q_${transformations.quality}`);
      if (transformations.format)
        transformParts.push(`f_${transformations.format}`);
      if (transformations.gravity)
        transformParts.push(`g_${transformations.gravity}`);
      if (transformations.effect)
        transformParts.push(`e_${transformations.effect}`);

      if (transformParts.length > 0) {
        url += `/${transformParts.join(",")}`;
      }
    }

    return `${url}/${publicId}`;
  }
}

// Factory function for easier usage
export function createCloudinaryUploader(
  config: CloudinaryConfig
): CloudinaryUploader {
  return new CloudinaryUploader(config);
}

// Utility function for validating file types and sizes
export function validateImageFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024,
    allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  } = options;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${
        file.type
      } is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(
        2
      )}MB exceeds maximum allowed size ${(maxSize / 1024 / 1024).toFixed(
        2
      )}MB`,
    };
  }

  return { valid: true };
}
