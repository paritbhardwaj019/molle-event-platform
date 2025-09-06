"use client";

import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { EventFormData } from "@/lib/validations/event";
import { suggestSlug } from "@/lib/actions/event";
import { getInviteForms } from "@/lib/actions/invite-form";
import { getEnabledExclusivePerks } from "@/lib/actions/exclusive-perk";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  MultiImageUpload,
  CloudinaryImage as MultiCloudinaryImage,
} from "@/lib/components/multi-image-upload";
import { EventImageData } from "@/lib/validations/event";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { PreviewInviteFormDialog } from "@/components/invite-forms/preview-invite-form-dialog";
import { CitySearch } from "@/components/ui/city-search";
import { toast } from "sonner";

interface CloudinaryImage {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  uploadedAt: string;
}

interface InviteForm {
  id: string;
  name: string;
  description: string | null;
  fields: Array<{
    id: string;
    name: string;
    type: string;
    placeholder: string | null;
    required: boolean;
    options: any;
    order: number;
  }>;
}

interface BasicInfoStepProps {
  form: UseFormReturn<EventFormData>;
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const [eventImages, setEventImages] = useState<MultiCloudinaryImage[]>([]);
  const [inviteForms, setInviteForms] = useState<InviteForm[]>([]);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedFormForPreview, setSelectedFormForPreview] =
    useState<InviteForm | null>(null);
  const [exclusivePerks, setExclusivePerks] = useState<any[]>([]);
  const [isLoadingPerks, setIsLoadingPerks] = useState(false);

  const isExclusive = form.watch("isExclusive") || false;

  // Initialize eventImages with existing images from form when editing
  useEffect(() => {
    const existingImages = form.getValues("images");
    if (existingImages && existingImages.length > 0) {
      const cloudinaryImages: MultiCloudinaryImage[] = existingImages.map(
        (img) => ({
          publicId: img.publicId,
          secureUrl: img.secureUrl,
          width: img.width,
          height: img.height,
          bytes: img.bytes,
          format: img.format,
          uploadedAt: img.uploadedAt,
          order: img.order || 0,
        })
      );
      setEventImages(cloudinaryImages);
    }
  }, [form]);

  useEffect(() => {
    const subscription = form.watch(async (value, { name }) => {
      if (name === "title") {
        const slug = await suggestSlug(value.title || "");
        form.setValue("slug", slug);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (eventImages.length > 0) {
      const imageData: EventImageData[] = eventImages.map((img, index) => ({
        publicId: img.publicId,
        secureUrl: img.secureUrl,
        width: img.width,
        height: img.height,
        bytes: img.bytes,
        format: img.format,
        uploadedAt: img.uploadedAt,
        order: img.order || index,
      }));
      form.setValue("images", imageData);
      form.setValue("coverImage", eventImages[0].secureUrl);
    } else {
      form.setValue("images", []);
      form.setValue("coverImage", "");
    }
  }, [eventImages, form]);

  useEffect(() => {
    const fetchInviteForms = async () => {
      try {
        const result = await getInviteForms();
        if (result.success && result.data) {
          setInviteForms(result.data);
        } else {
          toast.error("Failed to load invite forms");
        }
      } catch (error) {
        console.error("Error fetching invite forms:", error);
        toast.error("Failed to load invite forms");
      }
    };

    fetchInviteForms();
  }, []);

  // Fetch enabled exclusive perks to display in the UI (always visible)
  useEffect(() => {
    const fetchExclusivePerks = async () => {
      setIsLoadingPerks(true);
      try {
        const result = await getEnabledExclusivePerks();
        if (result.success && result.data) {
          setExclusivePerks(result.data);
        } else {
          console.error("Failed to fetch perks:", result.error);
          setExclusivePerks([]);
        }
      } catch (error) {
        console.error("Error fetching perks:", error);
        setExclusivePerks([]);
      } finally {
        setIsLoadingPerks(false);
      }
    };

    fetchExclusivePerks();
  }, []);

  const selectedInviteFormId = form.watch("settings.inviteFormId");
  const selectedInviteForm = inviteForms.find(
    (f) => f.id === selectedInviteFormId
  );

  const handlePreviewForm = () => {
    if (selectedInviteForm) {
      setSelectedFormForPreview(selectedInviteForm);
      setShowPreviewDialog(true);
    }
  };

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Title</FormLabel>
            <FormControl>
              <Input placeholder="Summer Music Festival 2024" {...field} />
            </FormControl>
            <FormDescription>
              Choose a clear and descriptive title for your event
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Description</FormLabel>
            <FormControl>
              <RichTextEditor
                content={field.value || ""}
                onChange={field.onChange}
                placeholder="Tell people what your event is about..."
                className="min-h-[200px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Address Fields */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Event Address</h3>

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <CitySearch
                  variant="form"
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  placeholder="Search and select city"
                  className="w-full"
                />
              </FormControl>
              <FormDescription>
                Choose the city where your event will take place
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="streetAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="123 Main Street, Building Name, Area"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Complete street address including building name and area
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="landmark"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Landmark (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Near Central Mall, Opposite Metro Station"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Nearby landmarks to help people find the venue easily
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location Summary</FormLabel>
              <FormControl>
                <Input placeholder="Mumbai, Maharashtra" {...field} />
              </FormControl>
              <FormDescription>
                Short location summary for display purposes
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="images"
        render={() => (
          <FormItem>
            <FormLabel>Event Images</FormLabel>
            <FormControl>
              <MultiImageUpload
                images={eventImages}
                onImagesChange={setEventImages}
                maxImages={8}
                cloudinaryConfig={{
                  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
                  uploadPreset:
                    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
                  folder: "event-covers",
                }}
                uploadOptions={{
                  quality: "auto",
                }}
              />
            </FormControl>
            <FormDescription>
              Upload high-quality images (JPG/PNG, max 5MB each). The first
              image will be used as the cover.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="eventType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Type</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal">Normal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="invite_only" id="invite_only" />
                  <Label htmlFor="invite_only">Invite Only</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Exclusive Event Section */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="isExclusive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Exclusive Event</FormLabel>
                <FormDescription>
                  Make this an exclusive event with special perks
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  defaultChecked={false}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Card
          className={`mt-3 ${
            isExclusive ? "border-blue-100" : "border-gray-200 opacity-60"
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <span>Exclusive Perks</span>
              {isExclusive ? (
                <Badge className="ml-2 bg-blue-500">Active</Badge>
              ) : (
                <Badge className="ml-2 bg-gray-400">Preview</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isExclusive && (
              <div className="mb-4 bg-amber-50 p-3 rounded-md text-xs text-amber-700 border border-amber-200">
                <p className="font-medium mb-1">
                  ⚠️ Exclusive Event is disabled
                </p>
                <p>
                  Enable "Exclusive Event" above to activate these perks for
                  your event.
                </p>
              </div>
            )}
            {isLoadingPerks ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span className="ml-2 text-sm text-gray-500">
                  Loading perks...
                </span>
              </div>
            ) : exclusivePerks.length > 0 ? (
              <ul className="space-y-2">
                {exclusivePerks.map((perk: any) => (
                  <li key={perk.id} className="flex items-start">
                    <div
                      className={`mr-2 mt-1 h-2 w-2 rounded-full ${
                        isExclusive ? "bg-blue-500" : "bg-gray-400"
                      }`}
                    />
                    <div>
                      <p className="font-medium">{perk.name}</p>
                      {perk.description && (
                        <p className="text-sm text-gray-600">
                          {perk.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm py-2">
                No exclusive perks are currently available.
              </p>
            )}
            <div
              className={`mt-4 p-3 rounded-md text-xs ${
                isExclusive
                  ? "bg-blue-50 text-blue-700"
                  : "bg-gray-50 text-gray-600"
              }`}
            >
              <p>
                •{" "}
                {isExclusive
                  ? "Exclusive events get special treatment and promotion"
                  : "These perks will be available when exclusive mode is enabled"}
              </p>
              <p>
                •{" "}
                {isExclusive
                  ? "Attendees will see these perks when booking"
                  : "Enable exclusive event to show these perks to attendees"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <FormField
        control={form.control}
        name="slug"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event URL Slug</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              This will be auto-generated from the title, but you can customize
              it
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="organizerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Host Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="organizerBio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Host Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell people about the host..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {form.watch("eventType") === "invite_only" && (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="settings.inviteFormId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invite Form</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select invite form" />
                    </SelectTrigger>
                    <SelectContent>
                      {inviteForms.map((form) => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>
                  Choose the invite form for this event
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedInviteForm && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviewForm}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview Form
              </Button>
              <span className="text-sm text-gray-500">
                Preview how the invite form will look to users
              </span>
            </div>
          )}
        </div>
      )}

      {selectedFormForPreview && (
        <PreviewInviteFormDialog
          open={showPreviewDialog}
          onOpenChange={setShowPreviewDialog}
          form={selectedFormForPreview}
        />
      )}
    </div>
  );
}
