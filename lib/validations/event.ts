import { z } from "zod";

export const packageSchema = z.object({
  name: z.string().min(1, "Package name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
  maxTicketsPerBooking: z.number().min(1, "Max tickets must be at least 1"),
  includedItems: z.array(z.string()).min(1, "Add at least one included item"),
});

export const eventSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    coverImage: z.string().min(1, "Cover image is required"),
    slug: z.string().min(1, "Slug is required"),
    eventType: z.enum(["normal", "invite_only"]),
    status: z.enum(["draft", "published", "cancelled"]),
    ageLimits: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      note: z.string().optional(),
    }),
    totalCapacity: z.number().min(1, "Total capacity must be at least 1"),
    organizerName: z.string().min(1, "Organizer name is required"),
    organizerBio: z.string().optional(),
    startDate: z.date(),
    endDate: z.date(),
    settings: z.object({
      featured: z.boolean().default(false),
      allowReferrals: z.boolean().default(true),
      autoApproveInvites: z.boolean().default(false),
    }),
    amenities: z.array(z.string()).min(1, "Add at least one amenity"),
    packages: z.array(packageSchema).min(1, "Add at least one package"),
  })
  .refine(
    (data) => data.endDate >= data.startDate,
    "End date must be after or equal to start date"
  );

export type EventFormData = z.infer<typeof eventSchema>;
