import { z } from "zod";

export const packageSchema = z.object({
  id: z.string().optional(), // Optional ID for existing packages during updates
  name: z.string().min(1, "Package name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
  maxTicketsPerBooking: z.number().min(1, "Max tickets must be at least 1"),
  allocation: z.number().min(1, "Allocation must be at least 1"),
  includedItems: z.array(z.string()).min(1, "Add at least one included item"),
});

export const eventImageSchema = z.object({
  publicId: z.string(),
  secureUrl: z.string(),
  width: z.number(),
  height: z.number(),
  bytes: z.number(),
  format: z.string(),
  uploadedAt: z.string(),
  order: z.number().default(0),
});

export const eventSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    images: z.array(eventImageSchema).min(1, "At least one image is required"),
    slug: z.string().min(1, "Slug is required"),
    eventType: z.enum(["normal", "invite_only"]),
    status: z.enum(["draft", "published", "cancelled"]),
    isExclusive: z.boolean().default(false),
    location: z.string().min(1, "Location is required"),
    city: z.string().optional(),
    landmark: z.string().optional(),
    streetAddress: z.string().optional(),
    ageLimits: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      note: z.string().optional(),
    }),
    totalCapacity: z.number().min(1, "Total capacity must be at least 1"),
    maxTicketsPerUser: z.number().optional(),
    organizerName: z.string().min(1, "Host name is required"),
    organizerBio: z.string().optional(),
    startDate: z.date(),
    endDate: z.date(),
    settings: z.object({
      allowReferrals: z.boolean().default(true),
      autoApproveInvites: z.boolean().default(false),
      referralPercentage: z.number().min(0).max(100).default(5),
      inviteFormId: z.string().optional(),
    }),
    amenities: z.array(z.string()).min(1, "Add at least one amenity"),
    packages: z.array(packageSchema).min(1, "Add at least one package"),
  })
  .refine(
    (data) => data.endDate >= data.startDate,
    "End date must be after or equal to start date"
  )
  .refine((data) => {
    const totalAllocation = data.packages.reduce(
      (sum, pkg) => sum + pkg.allocation,
      0
    );
    return totalAllocation <= data.totalCapacity;
  }, "Total ticket allocation cannot exceed the total capacity");

export const eventUpdateSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    images: z.array(eventImageSchema).optional().default([]),
    slug: z.string().min(1, "Slug is required"),
    eventType: z.enum(["normal", "invite_only"]),
    status: z.enum(["draft", "published", "cancelled"]),
    isExclusive: z.boolean().default(false),
    location: z.string().min(1, "Location is required"),
    city: z.string().optional(),
    landmark: z.string().optional(),
    streetAddress: z.string().optional(),
    ageLimits: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      note: z.string().optional(),
    }),
    totalCapacity: z.number().min(1, "Total capacity must be at least 1"),
    maxTicketsPerUser: z.number().optional(),
    organizerName: z.string().min(1, "Host name is required"),
    organizerBio: z.string().optional(),
    startDate: z.date(),
    endDate: z.date(),
    settings: z.object({
      allowReferrals: z.boolean().default(true),
      autoApproveInvites: z.boolean().default(false),
      referralPercentage: z.number().min(0).max(100).default(5),
      inviteFormId: z.string().optional(),
    }),
    amenities: z.array(z.string()).min(1, "Add at least one amenity"),
    packages: z.array(packageSchema).min(1, "Add at least one package"),
  })
  .refine(
    (data) => data.endDate >= data.startDate,
    "End date must be after or equal to start date"
  )
  .refine((data) => {
    const totalAllocation = data.packages.reduce(
      (sum, pkg) => sum + pkg.allocation,
      0
    );
    return totalAllocation <= data.totalCapacity;
  }, "Total ticket allocation cannot exceed the total capacity");

export type EventFormData = z.infer<typeof eventSchema>;
export type EventUpdateData = z.infer<typeof eventUpdateSchema>;
export type EventImageData = z.infer<typeof eventImageSchema>;
