"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CitySearch } from "@/components/ui/city-search";
import { toast } from "sonner";
import {
  createOrUpdateKycRequest,
  KycRequest,
  KycRequestFormData,
} from "@/lib/actions/kyc";

import { Upload, X, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createCloudinaryUploader, validateImageFile } from "@/lib/cloudinary";

interface KycFormProps {
  existingRequest?: KycRequest | null;
  onSuccess?: (request: KycRequest) => void;
}

interface FileUpload {
  file: File | null;
  preview: string | null;
  url?: string;
}

export function KycForm({ existingRequest, onSuccess }: KycFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const cloudinary = createCloudinaryUploader({
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
    folder: "kyc-documents",
  });

  const [formData, setFormData] = useState({
    name: existingRequest?.name || "",
    dateOfBirth: existingRequest?.dateOfBirth
      ? new Date(existingRequest.dateOfBirth).toISOString().split("T")[0]
      : "",
    contactNumber: existingRequest?.contactNumber || "",
    whatsappNumber: existingRequest?.whatsappNumber || "",
    email: existingRequest?.email || "",
    eventCity: existingRequest?.eventCity || "",
    eventVenueDetails: existingRequest?.eventVenueDetails || "",
    eventVenueCapacity: existingRequest?.eventVenueCapacity || "",
    willGetPermissions: existingRequest?.willGetPermissions ?? true,
    permissionsExplanation: existingRequest?.permissionsExplanation || "",
    willHaveSecurity: existingRequest?.willHaveSecurity ?? true,
    securityDetails: existingRequest?.securityDetails || "",
    agreeToAssessment: existingRequest?.agreeToAssessment ?? false,
    understandPayouts: existingRequest?.understandPayouts ?? false,
    agreeSafetyResponsibilities:
      existingRequest?.agreeSafetyResponsibilities ?? false,
    accountNumber: existingRequest?.accountNumber || "",
    bankName: existingRequest?.bankName || "",
    bankBranch: existingRequest?.bankBranch || "",
  });

  const [files, setFiles] = useState<{
    aadharFront: FileUpload;
    aadharBack: FileUpload;
    panFront: FileUpload;
    panBack: FileUpload;
  }>({
    aadharFront: {
      file: null,
      preview: null,
      url: existingRequest?.aadharFrontUrl,
    },
    aadharBack: {
      file: null,
      preview: null,
      url: existingRequest?.aadharBackUrl,
    },
    panFront: {
      file: null,
      preview: null,
      url: existingRequest?.panFrontUrl,
    },
    panBack: {
      file: null,
      preview: null,
      url: existingRequest?.panBackUrl,
    },
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: keyof typeof files, file: File | null) => {
    if (file) {
      // Validate file using Cloudinary utility
      const validation = validateImageFile(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ["image/jpeg", "image/jpg", "image/png"],
      });

      if (!validation.valid) {
        toast.error(validation.error || "Invalid file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setFiles((prev) => ({
          ...prev,
          [field]: {
            file,
            preview: e.target?.result as string,
            url: undefined,
          },
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFiles((prev) => ({
        ...prev,
        [field]: { file: null, preview: null, url: prev[field].url },
      }));
    }
  };

  const removeFile = (field: keyof typeof files) => {
    setFiles((prev) => ({
      ...prev,
      [field]: { file: null, preview: null, url: undefined },
    }));
  };

  // Upload file to Cloudinary
  const uploadFile = async (file: File): Promise<string> => {
    try {
      const response = await cloudinary.uploadFile(file, {
        folder: "kyc-documents",
        quality: "auto",
      });
      return response.secure_url;
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error("Failed to upload file");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      const requiredFields = [
        "name",
        "dateOfBirth",
        "contactNumber",
        "whatsappNumber",
        "email",
        "eventCity",
        "eventVenueDetails",
        "eventVenueCapacity",
        "accountNumber",
        "bankName",
        "bankBranch",
      ];
      for (const field of requiredFields) {
        if (!formData[field as keyof typeof formData]) {
          toast.error(
            `${
              field.charAt(0).toUpperCase() +
              field.slice(1).replace(/([A-Z])/g, " $1")
            } is required`
          );
          return;
        }
      }

      // Validate checkboxes
      if (!formData.agreeToAssessment) {
        toast.error("You must agree to assessment");
        return;
      }
      if (!formData.understandPayouts) {
        toast.error("You must understand payout terms");
        return;
      }
      if (!formData.agreeSafetyResponsibilities) {
        toast.error("You must agree to safety responsibilities");
        return;
      }

      const fileFields = [
        "aadharFront",
        "aadharBack",
        "panFront",
        "panBack",
      ] as const;
      for (const field of fileFields) {
        const fileData = files[field];
        if (!fileData.file && !fileData.url) {
          toast.error(
            `${field.replace(/([A-Z])/g, " $1").toLowerCase()} is required`
          );
          return;
        }
      }

      // Upload new files
      const uploadPromises: Promise<string>[] = [];
      const fileUrls: Record<string, string> = {};

      for (const field of fileFields) {
        const fileData = files[field];
        if (fileData.file) {
          uploadPromises.push(
            uploadFile(fileData.file).then((url) => {
              fileUrls[`${field}Url`] = url;
              return url;
            })
          );
        } else if (fileData.url) {
          fileUrls[`${field}Url`] = fileData.url;
        }
      }

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      const kycData: KycRequestFormData = {
        ...formData,
        aadharFrontUrl: fileUrls.aadharFrontUrl,
        aadharBackUrl: fileUrls.aadharBackUrl,
        panFrontUrl: fileUrls.panFrontUrl,
        panBackUrl: fileUrls.panBackUrl,
      };

      const result = await createOrUpdateKycRequest(kycData);

      if (result.success) {
        toast.success(
          existingRequest
            ? "KYC request updated successfully"
            : "KYC request submitted successfully"
        );
        if (onSuccess && result.data) {
          onSuccess(result.data);
        }
      } else {
        toast.error(result.error || "Failed to submit KYC request");
      }
    } catch (error) {
      console.error("Error submitting KYC:", error);
      toast.error("An error occurred while submitting KYC request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadOnly = Boolean(
    existingRequest && existingRequest.status !== "REJECTED"
  );

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name *</Label>
              <p className="text-sm text-gray-500">As per government ID</p>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  handleInputChange("dateOfBirth", e.target.value)
                }
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={isReadOnly}
                placeholder="your.email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventCity">Event City *</Label>
              <CitySearch
                value={formData.eventCity}
                onValueChange={(value) => handleInputChange("eventCity", value)}
                placeholder="Search and select event city"
                disabled={isReadOnly}
                variant="form"
                showIcon={true}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Call Number *</Label>
              <Input
                id="contactNumber"
                value={formData.contactNumber}
                onChange={(e) =>
                  handleInputChange("contactNumber", e.target.value)
                }
                disabled={isReadOnly}
                placeholder="+91 9876543210"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp Number *</Label>
              <Input
                id="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={(e) =>
                  handleInputChange("whatsappNumber", e.target.value)
                }
                disabled={isReadOnly}
                placeholder="+91 9876543210"
              />
            </div>
          </div>
        </div>

        {/* Event Venue Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Event Venue Information
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventVenueDetails">Event Venue Details *</Label>
              <Textarea
                id="eventVenueDetails"
                value={formData.eventVenueDetails}
                onChange={(e) =>
                  handleInputChange("eventVenueDetails", e.target.value)
                }
                disabled={isReadOnly}
                placeholder="Describe your event venue in detail"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventVenueCapacity">
                Event Venue Crowd Size *
              </Label>
              <p className="text-sm text-gray-500">
                Eg: Villa with 100 people crowd size, House with 15 people crowd
                size
              </p>
              <p className="text-sm text-gray-500">
                Note: Your event on our app should only have seats which your
                venue can handle
              </p>
              <Input
                id="eventVenueCapacity"
                value={formData.eventVenueCapacity}
                onChange={(e) =>
                  handleInputChange("eventVenueCapacity", e.target.value)
                }
                disabled={isReadOnly}
                placeholder="Enter venue crowd size details"
              />
            </div>
          </div>
        </div>

        {/* Permissions and Security */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Permissions and Security
          </h3>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label>
                Will you get permissions of music, liquor and other required
                legal permissions? *
              </Label>
              <p className="text-sm text-gray-500">
                Permissions to play music, have liquor can be required but if
                you don't need it then you can explain us why you will not need
                permissions and then you can proceed.
              </p>
              <RadioGroup
                value={formData.willGetPermissions.toString()}
                onValueChange={(value) =>
                  handleInputChange("willGetPermissions", value === "true")
                }
                disabled={isReadOnly}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="permissions-yes" />
                  <Label htmlFor="permissions-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="permissions-no" />
                  <Label htmlFor="permissions-no">No</Label>
                </div>
              </RadioGroup>

              {!formData.willGetPermissions && (
                <div className="space-y-2">
                  <Label htmlFor="permissionsExplanation">
                    Please explain why you won't need permissions
                  </Label>
                  <Textarea
                    id="permissionsExplanation"
                    value={formData.permissionsExplanation}
                    onChange={(e) =>
                      handleInputChange(
                        "permissionsExplanation",
                        e.target.value
                      )
                    }
                    disabled={isReadOnly}
                    placeholder="Explain why permissions are not required"
                    className="min-h-[80px]"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Will you have professional security team? *</Label>
              <RadioGroup
                value={formData.willHaveSecurity.toString()}
                onValueChange={(value) =>
                  handleInputChange("willHaveSecurity", value === "true")
                }
                disabled={isReadOnly}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="security-yes" />
                  <Label htmlFor="security-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="security-no" />
                  <Label htmlFor="security-no">No</Label>
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label htmlFor="securityDetails">Security Details</Label>
                <Textarea
                  id="securityDetails"
                  value={formData.securityDetails}
                  onChange={(e) =>
                    handleInputChange("securityDetails", e.target.value)
                  }
                  disabled={isReadOnly}
                  placeholder="Provide details about your security arrangements"
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number *</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) =>
                  handleInputChange("accountNumber", e.target.value)
                }
                disabled={isReadOnly}
                placeholder="Enter your account number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => handleInputChange("bankName", e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter your bank name"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bankBranch">IFSC Code *</Label>
              <Input
                id="bankBranch"
                value={formData.bankBranch}
                onChange={(e) =>
                  handleInputChange("bankBranch", e.target.value)
                }
                disabled={isReadOnly}
                placeholder="Enter IFSC code"
              />
            </div>
          </div>
        </div>

        {/* Agreements */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Agreements</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="agreeToAssessment"
                checked={formData.agreeToAssessment}
                onCheckedChange={(checked) =>
                  handleInputChange("agreeToAssessment", checked === true)
                }
                disabled={isReadOnly}
                className="mt-1"
              />
              <div className="space-y-1">
                <Label
                  htmlFor="agreeToAssessment"
                  className="text-sm font-medium"
                >
                  Assessment Agreement *
                </Label>
                <p className="text-sm text-gray-600">
                  We might come to assess the event to see if things are going
                  smoothly as mentioned and meeting the description of event. I
                  agree to this.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="understandPayouts"
                checked={formData.understandPayouts}
                onCheckedChange={(checked) =>
                  handleInputChange("understandPayouts", checked === true)
                }
                disabled={isReadOnly}
                className="mt-1"
              />
              <div className="space-y-1">
                <Label
                  htmlFor="understandPayouts"
                  className="text-sm font-medium"
                >
                  Payout Terms *
                </Label>
                <p className="text-sm text-gray-600">
                  Payouts are given after the event is conducted to prevent any
                  fraudulent activities. I understand this.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="agreeSafetyResponsibilities"
                checked={formData.agreeSafetyResponsibilities}
                onCheckedChange={(checked) =>
                  handleInputChange(
                    "agreeSafetyResponsibilities",
                    checked === true
                  )
                }
                disabled={isReadOnly}
                className="mt-1"
              />
              <div className="space-y-1">
                <Label
                  htmlFor="agreeSafetyResponsibilities"
                  className="text-sm font-medium"
                >
                  Safety Responsibilities *
                </Label>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    At Molle, we prioritize the safety and well-being of all
                    event attendees. As a host, it is your responsibility to
                    create a safe and respectful environment, especially for
                    female guests.
                  </p>
                  <div className="space-y-1">
                    <p>
                      <strong>Your responsibilities include:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <strong>Ensure Proper Security:</strong> Appoint
                        trustworthy individuals or professional security to
                        monitor the event and address inappropriate behavior
                        promptly.
                      </li>
                      <li>
                        <strong>Alcohol and Substance Control:</strong> Monitor
                        alcohol distribution and consumption. Do not allow
                        underage drinking or excessive intoxication that could
                        lead to unsafe behavior.
                      </li>
                      <li>
                        <strong>Maintain Respect:</strong> Ensure that all
                        attendees behave respectfully toward each other.
                        Disrespectful, harassing, or inappropriate behavior will
                        not be tolerated.
                      </li>
                      <li>
                        <strong>Monitor Safety:</strong> Keep an eye on the
                        event to prevent any situations that could lead to harm
                        or discomfort for any guest.
                      </li>
                      <li>
                        <strong>Provide Safe Spaces:</strong> Offer a secure and
                        welcoming environment for everyone, ensuring there is no
                        harassment or unwanted attention.
                      </li>
                      <li>
                        <strong>Immediate Action:</strong> Address any
                        complaints or issues from attendees promptly. Remove
                        anyone exhibiting harmful behavior.
                      </li>
                      <li>
                        <strong>Emergency Measures:</strong> Be prepared with
                        emergency contact numbers and have clear exits in case
                        of emergencies.
                      </li>
                    </ul>
                  </div>
                  <p className="font-medium">
                    Failure to ensure the safety and well-being of attendees,
                    especially female guests, will result in strict action.
                  </p>
                  <p className="font-medium">
                    Remember: A safe and enjoyable event ensures trust and
                    positive experiences for everyone.
                  </p>
                  <p className="font-medium">
                    I agree to all safety responsibilities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Document Uploads
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "aadharFront" as const, label: "Aadhar Card (Front)" },
              { key: "aadharBack" as const, label: "Aadhar Card (Back)" },
              { key: "panFront" as const, label: "PAN Card (Front)" },
              { key: "panBack" as const, label: "PAN Card (Back)" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {files[key].preview || files[key].url ? (
                    <div className="relative">
                      <img
                        src={files[key].preview || files[key].url}
                        alt={label}
                        className="w-full h-32 object-cover rounded"
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            setPreviewImage(
                              files[key].preview || files[key].url || null
                            )
                          }
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {!isReadOnly && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeFile(key)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="mt-2">
                        <Label
                          htmlFor={`file-${key}`}
                          className="cursor-pointer text-sm text-purple-600 hover:text-purple-500"
                        >
                          Click to upload {label.toLowerCase()}
                        </Label>
                        <Input
                          id={`file-${key}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleFileChange(key, e.target.files?.[0] || null)
                          }
                          disabled={isReadOnly}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Submitting..."
                : existingRequest
                ? "Update KYC Request"
                : "Submit KYC Request"}
            </Button>
          </div>
        )}
      </form>

      <Dialog
        open={previewImage !== null}
        onOpenChange={() => setPreviewImage(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage}
              alt="Document preview"
              className="w-full h-auto max-h-96 object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
