"use client";

import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { EventFormData } from "@/lib/validations/event";
import { suggestSlug } from "@/lib/actions/event";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/lib/components/image-upload";

interface CloudinaryImage {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  uploadedAt: string;
}

interface BasicInfoStepProps {
  form: UseFormReturn<EventFormData>;
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const [coverImages, setCoverImages] = useState<CloudinaryImage[]>([]);

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
    if (coverImages.length > 0) {
      form.setValue("coverImage", coverImages[0].secureUrl);
    } else {
      form.setValue("coverImage", "");
    }
  }, [coverImages, form]);

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
              <Textarea
                placeholder="Tell people what your event is about..."
                className="min-h-[120px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="coverImage"
        render={() => (
          <FormItem>
            <FormLabel>Cover Image</FormLabel>
            <FormControl>
              <ImageUpload
                images={coverImages}
                onImagesChange={setCoverImages}
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
              Upload a high-quality image (JPG/PNG, max 5MB)
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
              <FormLabel>Organizer Name</FormLabel>
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
              <FormLabel>Organizer Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell people about the organizer..."
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
    </div>
  );
}
