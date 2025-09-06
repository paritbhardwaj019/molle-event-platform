"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function serializeData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(serializeData);
  }

  if (typeof data === "object") {
    if (data instanceof Date) {
      return data.toISOString();
    }

    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeData(value);
    }
    return serialized;
  }

  return data;
}

interface CreateInviteFormParams {
  name: string;
  description?: string;
  fields: {
    name: string;
    type: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    order: number;
  }[];
}

interface UpdateInviteFormParams {
  id: string;
  name: string;
  description?: string;
  fields: {
    id?: string;
    name: string;
    type: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    order: number;
  }[];
}

export async function createInviteForm({
  name,
  description,
  fields,
}: CreateInviteFormParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to create invite forms",
      };
    }

    // Check if user is HOST
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "HOST") {
      return {
        success: false,
        error: "Only hosts can create invite forms",
      };
    }

    const inviteForm = await db.inviteForm.create({
      data: {
        name,
        description,
        hostId: session.user.id,
        fields: {
          create: fields.map((field) => ({
            name: field.name,
            type: field.type,
            placeholder: field.placeholder,
            required: field.required,
            options: field.options ? field.options : undefined,
            order: field.order,
          })),
        },
      },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
      },
    });

    revalidatePath("/dashboard/invite-forms");

    return {
      success: true,
      data: serializeData(inviteForm),
    };
  } catch (error) {
    console.error("Error creating invite form:", error);
    return {
      success: false,
      error: "Failed to create invite form",
    };
  }
}

export async function updateInviteForm({
  id,
  name,
  description,
  fields,
}: UpdateInviteFormParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to update invite forms",
      };
    }

    // Check if user is HOST and owns the form
    const existingForm = await db.inviteForm.findUnique({
      where: { id },
      select: { hostId: true },
    });

    if (!existingForm || existingForm.hostId !== session.user.id) {
      return {
        success: false,
        error: "You can only update your own invite forms",
      };
    }

    // Delete existing fields and create new ones
    await db.inviteFormField.deleteMany({
      where: { formId: id },
    });

    const inviteForm = await db.inviteForm.update({
      where: { id },
      data: {
        name,
        description,
        fields: {
          create: fields.map((field) => ({
            name: field.name,
            type: field.type,
            placeholder: field.placeholder,
            required: field.required,
            options: field.options ? field.options : undefined,
            order: field.order,
          })),
        },
      },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
      },
    });

    revalidatePath("/dashboard/invite-forms");

    return {
      success: true,
      data: serializeData(inviteForm),
    };
  } catch (error) {
    console.error("Error updating invite form:", error);
    return {
      success: false,
      error: "Failed to update invite form",
    };
  }
}

export async function deleteInviteForm(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to delete invite forms",
      };
    }

    // Check if user is HOST and owns the form
    const existingForm = await db.inviteForm.findUnique({
      where: { id },
      select: { hostId: true },
    });

    if (!existingForm || existingForm.hostId !== session.user.id) {
      return {
        success: false,
        error: "You can only delete your own invite forms",
      };
    }

    await db.inviteForm.delete({
      where: { id },
    });

    revalidatePath("/dashboard/invite-forms");

    return {
      success: true,
      message: "Invite form deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting invite form:", error);
    return {
      success: false,
      error: "Failed to delete invite form",
    };
  }
}

export async function getInviteForms() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view invite forms",
      };
    }

    // Check if user is HOST
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "HOST") {
      return {
        success: false,
        error: "Only hosts can view invite forms",
      };
    }

    const inviteForms = await db.inviteForm.findMany({
      where: {
        hostId: session.user.id,
        isActive: true,
      },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: serializeData(inviteForms),
    };
  } catch (error) {
    console.error("Error fetching invite forms:", error);
    return {
      success: false,
      error: "Failed to fetch invite forms",
    };
  }
}

export async function getInviteFormById(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view invite forms",
      };
    }

    const inviteForm = await db.inviteForm.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!inviteForm) {
      return {
        success: false,
        error: "Invite form not found",
      };
    }

    // Check if user is HOST and owns the form
    if (inviteForm.hostId !== session.user.id) {
      return {
        success: false,
        error: "You can only view your own invite forms",
      };
    }

    return {
      success: true,
      data: serializeData(inviteForm),
    };
  } catch (error) {
    console.error("Error fetching invite form:", error);
    return {
      success: false,
      error: "Failed to fetch invite form",
    };
  }
}

export async function getInviteFormForEvent(eventId: string) {
  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        inviteForm: {
          include: {
            fields: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!event || !event.inviteForm) {
      return {
        success: false,
        error: "No invite form found for this event",
      };
    }

    return {
      success: true,
      data: serializeData(event.inviteForm),
    };
  } catch (error) {
    console.error("Error fetching invite form for event:", error);
    return {
      success: false,
      error: "Failed to fetch invite form",
    };
  }
}
