"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { KycStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendHostKycApprovalEmail } from "@/lib/email";
import { z } from "zod";

const kycRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  contactNumber: z.string().min(10, "Valid contact number is required"),
  whatsappNumber: z.string().min(10, "Valid WhatsApp number is required"),
  email: z.string().email("Valid email is required"),
  eventCity: z.string().min(1, "Event city is required"),
  eventVenueDetails: z.string().min(1, "Event venue details are required"),
  eventVenueCapacity: z.string().min(1, "Event venue capacity is required"),
  willGetPermissions: z.boolean(),
  permissionsExplanation: z.string().optional(),
  willHaveSecurity: z.boolean(),
  securityDetails: z.string().optional(),
  agreeToAssessment: z
    .boolean()
    .refine((val) => val === true, "You must agree to assessment"),
  understandPayouts: z
    .boolean()
    .refine((val) => val === true, "You must understand payout terms"),
  agreeSafetyResponsibilities: z
    .boolean()
    .refine((val) => val === true, "You must agree to safety responsibilities"),
  accountNumber: z.string().min(1, "Account number is required"),
  bankName: z.string().min(1, "Bank name is required"),
  bankBranch: z.string().min(1, "Bank branch is required"),
  aadharFrontUrl: z.string().min(1, "Aadhar front image is required"),
  aadharBackUrl: z.string().min(1, "Aadhar back image is required"),
  panFrontUrl: z.string().min(1, "PAN front image is required"),
  panBackUrl: z.string().min(1, "PAN back image is required"),
});

export type KycRequestFormData = z.infer<typeof kycRequestSchema>;

export interface KycRequest {
  id: string;
  name: string;
  dateOfBirth: Date;
  contactNumber: string;
  whatsappNumber: string;
  email: string;
  eventCity: string;
  eventVenueDetails: string;
  eventVenueCapacity: string;
  willGetPermissions: boolean;
  permissionsExplanation: string | null;
  willHaveSecurity: boolean;
  securityDetails: string | null;
  agreeToAssessment: boolean;
  understandPayouts: boolean;
  agreeSafetyResponsibilities: boolean;
  accountNumber: string;
  bankName: string;
  bankBranch: string;
  aadharFrontUrl: string;
  aadharBackUrl: string;
  panFrontUrl: string;
  panBackUrl: string;
  status: KycStatus;
  adminReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

// Helper function to serialize data for client components
function serializeData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (data instanceof Date) {
    return data.toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(serializeData);
  }

  if (typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, serializeData(value)])
    );
  }

  return data;
}

export async function createOrUpdateKycRequest(data: KycRequestFormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to submit KYC request",
      };
    }

    if (session.user.role !== "HOST") {
      return {
        success: false,
        error: "Only hosts can submit KYC requests",
      };
    }

    // Validate the data
    const validatedData = kycRequestSchema.parse(data);

    // Convert dateOfBirth string to Date object
    const processedData = {
      ...validatedData,
      dateOfBirth: new Date(validatedData.dateOfBirth),
    };

    // Check if user already has a KYC request
    const existingRequest = await db.kycRequest.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    let kycRequest;

    if (existingRequest) {
      // Update existing request (only if it was rejected)
      if (existingRequest.status !== "REJECTED") {
        return {
          success: false,
          error: "You already have a pending or approved KYC request",
        };
      }

      kycRequest = await db.kycRequest.update({
        where: {
          id: existingRequest.id,
        },
        data: {
          ...processedData,
          status: "PENDING",
          adminReason: null,
        },
      });
    } else {
      // Create new request
      kycRequest = await db.kycRequest.create({
        data: {
          ...processedData,
          userId: session.user.id,
        },
      });
    }

    revalidatePath("/dashboard/kyc-verification");

    return {
      success: true,
      data: serializeData(kycRequest),
    };
  } catch (error) {
    console.error("Error creating/updating KYC request:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }
    return {
      success: false,
      error: "Failed to submit KYC request",
    };
  }
}

export async function getHostKycRequest() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in",
      };
    }

    if (session.user.role !== "HOST") {
      return {
        success: false,
        error: "Only hosts can view KYC requests",
      };
    }

    const kycRequest = await db.kycRequest.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: kycRequest ? serializeData(kycRequest) : null,
    };
  } catch (error) {
    console.error("Error fetching host KYC request:", error);
    return {
      success: false,
      error: "Failed to fetch KYC request",
    };
  }
}

export async function getAllKycRequests() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in",
      };
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only admins can view all KYC requests",
      };
    }

    const kycRequests = await db.kycRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: serializeData(kycRequests),
    };
  } catch (error) {
    console.error("Error fetching KYC requests:", error);
    return {
      success: false,
      error: "Failed to fetch KYC requests",
    };
  }
}

export async function approveKycRequest({ requestId }: { requestId: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in",
      };
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only admins can approve KYC requests",
      };
    }

    // Get the KYC request with user details before updating
    const existingRequest = await db.kycRequest.findUnique({
      where: {
        id: requestId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!existingRequest) {
      return {
        success: false,
        error: "KYC request not found",
      };
    }

    const kycRequest = await db.kycRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status: "APPROVED",
        adminReason: null,
      },
    });

    // Send approval email to the host
    if (existingRequest.user.email && existingRequest.user.name) {
      await sendHostKycApprovalEmail(
        existingRequest.user.name,
        existingRequest.user.email
      );
    }

    revalidatePath("/dashboard/admin/kyc-requests");

    return {
      success: true,
      data: serializeData(kycRequest),
    };
  } catch (error) {
    console.error("Error approving KYC request:", error);
    return {
      success: false,
      error: "Failed to approve KYC request",
    };
  }
}

export async function rejectKycRequest({
  requestId,
  reason,
}: {
  requestId: string;
  reason: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in",
      };
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only admins can reject KYC requests",
      };
    }

    if (!reason.trim()) {
      return {
        success: false,
        error: "Rejection reason is required",
      };
    }

    const kycRequest = await db.kycRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status: "REJECTED",
        adminReason: reason,
      },
    });

    revalidatePath("/dashboard/admin/kyc-requests");

    return {
      success: true,
      data: serializeData(kycRequest),
    };
  } catch (error) {
    console.error("Error rejecting KYC request:", error);
    return {
      success: false,
      error: "Failed to reject KYC request",
    };
  }
}
