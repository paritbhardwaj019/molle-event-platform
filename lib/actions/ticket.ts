"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export interface Ticket {
  id: string;
  ticketNumber: string;
  qrCode: string;
  status: string;
  fullName: string;
  age: number;
  phoneNumber: string;
  ticketPrice: number;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  createdAt: Date;
  event: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    location: string;
    coverImage: string;
  };
  package: {
    id: string;
    name: string;
    description: string | null;
  };
  booking: {
    id: string;
    bookingNumber: string;
  };
}

export async function getUserTickets() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const tickets = await db.ticket.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
            city: true,
            landmark: true,
            streetAddress: true,
            coverImage: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { data: tickets };
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    return { error: "Failed to fetch tickets" };
  }
}

export async function getTicketByQrCode(qrCode: string) {
  try {
    const ticket = await db.ticket.findUnique({
      where: {
        qrCode: qrCode,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
            city: true,
            landmark: true,
            streetAddress: true,
            coverImage: true,
            organizerName: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            description: true,
            benefits: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingNumber: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!ticket) {
      return { error: "Ticket not found" };
    }

    return { data: ticket };
  } catch (error) {
    console.error("Error fetching ticket by QR code:", error);
    return { error: "Failed to fetch ticket" };
  }
}

export async function verifyTicket(qrCode: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    // Check if the user is a host
    if (session.user.role !== "HOST" && session.user.role !== "ADMIN") {
      return { error: "Only hosts can verify tickets" };
    }

    const ticket = await db.ticket.findUnique({
      where: {
        qrCode: qrCode,
      },
      include: {
        event: {
          select: {
            id: true,
            hostId: true,
            title: true,
          },
        },
      },
    });

    if (!ticket) {
      return { error: "Ticket not found" };
    }

    // Check if the host owns this event (unless admin)
    if (
      session.user.role === "HOST" &&
      ticket.event.hostId !== session.user.id
    ) {
      return { error: "You can only verify tickets for your own events" };
    }

    if (ticket.status === "VERIFIED") {
      return { error: "Ticket has already been verified" };
    }

    if (ticket.status === "CANCELLED") {
      return { error: "This ticket has been cancelled" };
    }

    // Verify the ticket
    const verifiedTicket = await db.ticket.update({
      where: {
        id: ticket.id,
      },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
        verifiedBy: session.user.id,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
            city: true,
            landmark: true,
            streetAddress: true,
          },
        },
        package: {
          select: {
            name: true,
            description: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return { data: verifiedTicket, success: true };
  } catch (error) {
    console.error("Error verifying ticket:", error);
    return { error: "Failed to verify ticket" };
  }
}

export async function getTicketById(ticketId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const ticket = await db.ticket.findUnique({
      where: {
        id: ticketId,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
            city: true,
            landmark: true,
            streetAddress: true,
            coverImage: true,
            organizerName: true,
            organizerBio: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            description: true,
            benefits: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            bookedAt: true,
          },
        },
      },
    });

    if (!ticket) {
      return { error: "Ticket not found" };
    }

    // Check if the user owns this ticket
    if (ticket.userId !== session.user.id) {
      return { error: "You can only view your own tickets" };
    }

    return { data: ticket };
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return { error: "Failed to fetch ticket" };
  }
}
