"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type FAQ = {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateFAQInput = {
  question: string;
  answer: string;
  order?: number;
};

export type UpdateFAQInput = {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
  order: number;
};

export async function createFAQ(input: CreateFAQInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to create an FAQ",
      };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Only admins can create FAQs",
      };
    }

    if (!input.question.trim() || !input.answer.trim()) {
      return {
        success: false,
        error: "Question and answer are required",
      };
    }

    // Get the highest order number and add 1
    const lastFAQ = await db.fAQ.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const order = input.order ?? (lastFAQ?.order ?? 0) + 1;

    const faq = await db.fAQ.create({
      data: {
        question: input.question.trim(),
        answer: input.answer.trim(),
        order,
      },
    });

    revalidatePath("/dashboard/admin/faqs");
    revalidatePath("/contact-us");

    return {
      success: true,
      data: faq,
    };
  } catch (error) {
    console.error("Error creating FAQ:", error);
    return {
      success: false,
      error: "Failed to create FAQ",
    };
  }
}

export async function updateFAQ(input: UpdateFAQInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to update an FAQ",
      };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Only admins can update FAQs",
      };
    }

    if (!input.question.trim() || !input.answer.trim()) {
      return {
        success: false,
        error: "Question and answer are required",
      };
    }

    const faq = await db.fAQ.update({
      where: { id: input.id },
      data: {
        question: input.question.trim(),
        answer: input.answer.trim(),
        isActive: input.isActive,
        order: input.order,
      },
    });

    revalidatePath("/dashboard/admin/faqs");
    revalidatePath("/contact-us");

    return {
      success: true,
      data: faq,
    };
  } catch (error) {
    console.error("Error updating FAQ:", error);
    return {
      success: false,
      error: "Failed to update FAQ",
    };
  }
}

export async function deleteFAQ(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to delete an FAQ",
      };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Only admins can delete FAQs",
      };
    }

    await db.fAQ.delete({
      where: { id },
    });

    revalidatePath("/dashboard/admin/faqs");
    revalidatePath("/contact-us");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return {
      success: false,
      error: "Failed to delete FAQ",
    };
  }
}

export async function getAllFAQs() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view FAQs",
      };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Only admins can view all FAQs",
      };
    }

    const faqs = await db.fAQ.findMany({
      orderBy: { order: "asc" },
    });

    return {
      success: true,
      data: faqs,
    };
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return {
      success: false,
      error: "Failed to fetch FAQs",
    };
  }
}

export async function getPublicFAQs() {
  try {
    const faqs = await db.fAQ.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        question: true,
        answer: true,
        order: true,
      },
    });

    return {
      success: true,
      data: faqs,
    };
  } catch (error) {
    console.error("Error fetching public FAQs:", error);
    return {
      success: false,
      error: "Failed to fetch FAQs",
    };
  }
}

export async function toggleFAQStatus(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to toggle FAQ status",
      };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Only admins can toggle FAQ status",
      };
    }

    const currentFAQ = await db.fAQ.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!currentFAQ) {
      return {
        success: false,
        error: "FAQ not found",
      };
    }

    const faq = await db.fAQ.update({
      where: { id },
      data: { isActive: !currentFAQ.isActive },
    });

    revalidatePath("/dashboard/admin/faqs");
    revalidatePath("/contact-us");

    return {
      success: true,
      data: faq,
    };
  } catch (error) {
    console.error("Error toggling FAQ status:", error);
    return {
      success: false,
      error: "Failed to toggle FAQ status",
    };
  }
}
