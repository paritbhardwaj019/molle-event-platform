"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KycImageUpload } from "./kyc-image-upload";
import { Loader2, Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { submitDatingKyc } from "@/lib/actions/dating";

interface DatingKycFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  existingRequest?: any;
}

interface FormData {
  docType: "AADHAAR" | "PASSPORT" | "DRIVING_LICENSE";
  selfieUrl: string;
  docFrontUrl: string;
  docBackUrl: string;
}

export function DatingKycForm({
  open,
  onOpenChange,
  onSuccess,
  existingRequest,
}: DatingKycFormProps) {
  const [formData, setFormData] = useState<FormData>({
    docType: "AADHAAR",
    selfieUrl: "",
    docFrontUrl: "",
    docBackUrl: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const handleImageUpload = async (
    file: File,
    type: "selfie" | "docFront" | "docBack"
  ) => {
    setUploading(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "dating-kyc");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();

      if (!data.success || !data.url) {
        throw new Error("Invalid upload response");
      }

      setFormData((prev) => ({
        ...prev,
        [`${type}Url`]: data.url,
      }));

      toast.success(
        `${type === "selfie" ? "Selfie" : "Document"} uploaded successfully`
      );
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        `Failed to upload ${type === "selfie" ? "selfie" : "document"}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw error; // Re-throw to let the KycImageUpload component handle it
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.selfieUrl || !formData.docFrontUrl) {
      toast.error("Please upload all required documents");
      return;
    }

    if (formData.docType === "AADHAAR" && !formData.docBackUrl) {
      toast.error("Please upload both front and back of Aadhaar card");
      return;
    }

    setIsLoading(true);
    try {
      const result = await submitDatingKyc({
        docType: formData.docType,
        selfieUrl: formData.selfieUrl,
        docFrontUrl: formData.docFrontUrl,
        docBackUrl: formData.docBackUrl || undefined,
      });

      if (result.success) {
        toast.success(
          "KYC submitted successfully! It will be reviewed within 24-48 hours."
        );
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to submit KYC");
      }
    } catch (error) {
      console.error("KYC submission error:", error);
      toast.error("Failed to submit KYC");
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = (type: "selfie" | "docFront" | "docBack") => {
    setFormData((prev) => ({
      ...prev,
      [`${type}Url`]: "",
    }));
  };

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case "AADHAAR":
        return "Aadhaar Card";
      case "PASSPORT":
        return "Passport";
      case "DRIVING_LICENSE":
        return "Driving License";
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dating KYC Verification</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please provide a clear selfie and government ID for verification.
              Your information will be kept secure and only used for
              verification purposes.
            </AlertDescription>
          </Alert>

          {/* Document Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="docType">Document Type</Label>
            <Select
              value={formData.docType}
              onValueChange={(
                value: "AADHAAR" | "PASSPORT" | "DRIVING_LICENSE"
              ) => setFormData((prev) => ({ ...prev, docType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AADHAAR">
                  Aadhaar Card (Front + Back)
                </SelectItem>
                <SelectItem value="PASSPORT">Passport (Front)</SelectItem>
                <SelectItem value="DRIVING_LICENSE">
                  Driving License (Front)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selfie Upload */}
          <div className="space-y-2">
            <Label>Selfie Photo *</Label>
            <Card>
              <CardContent className="p-4">
                {formData.selfieUrl ? (
                  <div className="relative">
                    <img
                      src={formData.selfieUrl}
                      alt="Selfie"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => removeImage("selfie")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <KycImageUpload
                    onUpload={(file) => handleImageUpload(file, "selfie")}
                    disabled={uploading === "selfie"}
                    loading={uploading === "selfie"}
                    className="h-48"
                    placeholder="Upload a clear selfie photo"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document Front Upload */}
          <div className="space-y-2">
            <Label>Document Front *</Label>
            <Card>
              <CardContent className="p-4">
                {formData.docFrontUrl ? (
                  <div className="relative">
                    <img
                      src={formData.docFrontUrl}
                      alt="Document Front"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => removeImage("docFront")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <KycImageUpload
                    onUpload={(file) => handleImageUpload(file, "docFront")}
                    disabled={uploading === "docFront"}
                    loading={uploading === "docFront"}
                    className="h-48"
                    placeholder={`Upload ${getDocTypeLabel(
                      formData.docType
                    )} front`}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document Back Upload (for Aadhaar) */}
          {formData.docType === "AADHAAR" && (
            <div className="space-y-2">
              <Label>Document Back *</Label>
              <Card>
                <CardContent className="p-4">
                  {formData.docBackUrl ? (
                    <div className="relative">
                      <img
                        src={formData.docBackUrl}
                        alt="Document Back"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => removeImage("docBack")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <KycImageUpload
                      onUpload={(file) => handleImageUpload(file, "docBack")}
                      disabled={uploading === "docBack"}
                      loading={uploading === "docBack"}
                      className="h-48"
                      placeholder="Upload Aadhaar card back"
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Requirements */}
          <div className="space-y-3">
            <h4 className="font-medium">Requirements:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Selfie must be clear and show your full face</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Document must be clearly visible and not blurry</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>File size must be less than 10MB</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Supported formats: JPG, PNG, WebP</span>
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !formData.selfieUrl ||
                !formData.docFrontUrl ||
                (formData.docType === "AADHAAR" && !formData.docBackUrl)
              }
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit KYC"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
