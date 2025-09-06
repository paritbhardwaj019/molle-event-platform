"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { UserRole, UserStatus } from "@prisma/client";

export type Customer = {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  createdAt: Date;
  referredBy: string | null;
  referrerName: string | null;
  referrerCode: string | null;
  totalPurchaseValue: number;
  lastPurchaseDate: Date | null;
};

export async function getAllCustomers() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view customers",
      };
    }

    // Check user role and permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "HOST" && user.role !== "ADMIN")) {
      return {
        success: false,
        error: "Only hosts and admins can view customers",
      };
    }

    let whereClause: any = {
      role: "USER",
    };

    // If user is HOST, only show customers who have booked their events
    if (user.role === "HOST") {
      whereClause.bookings = {
        some: {
          event: {
            hostId: session.user.id,
          },
        },
      };
    }
    // Admin can see all customers (no additional filtering needed)

    const customers = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        referredBy: true,
        bookings: {
          select: {
            totalAmount: true,
            bookedAt: true,
            event: {
              select: {
                hostId: true,
              },
            },
          },
          // If user is HOST, only include bookings for their events
          ...(user.role === "HOST" && {
            where: {
              event: {
                hostId: session.user.id,
              },
            },
          }),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedCustomers: Customer[] = await Promise.all(
      customers.map(async (customer) => {
        const totalPurchaseValue = customer.bookings.reduce(
          (sum, booking) => sum + Number(booking.totalAmount),
          0
        );

        const lastPurchaseDate =
          customer.bookings.length > 0
            ? customer.bookings.reduce(
                (latest, booking) =>
                  latest > booking.bookedAt ? latest : booking.bookedAt,
                customer.bookings[0].bookedAt
              )
            : null;

        let referrerName = null;
        let referrerCode = null;

        if (customer.referredBy) {
          try {
            const referrer = await db.user.findUnique({
              where: {
                id: customer.referredBy,
              },
              select: {
                name: true,
                referralCode: true,
              },
            });

            if (referrer) {
              referrerName = referrer.name;
              referrerCode = referrer.referralCode;
            }
          } catch (error) {
            console.error(
              `Error fetching referrer for customer ${customer.id}:`,
              error
            );
          }
        }

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          status: customer.status,
          createdAt: customer.createdAt,
          referredBy: customer.referredBy,
          referrerName,
          referrerCode,
          totalPurchaseValue,
          lastPurchaseDate,
        };
      })
    );

    return { success: true, data: formattedCustomers };
  } catch (error) {
    console.error("Error fetching customers:", error);
    return { success: false, error: "Failed to fetch customers" };
  }
}

export async function getCustomerById(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view customer details",
      };
    }

    // Check user role and permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "HOST" && user.role !== "ADMIN")) {
      return {
        success: false,
        error: "Only hosts and admins can view customer details",
      };
    }

    const customer = await db.user.findUnique({
      where: {
        id,
        role: "USER",
      },
      include: {
        bookings: {
          include: {
            event: true,
            package: true,
            payment: true,
          },
          // If user is HOST, only include bookings for their events
          ...(user.role === "HOST" && {
            where: {
              event: {
                hostId: session.user.id,
              },
            },
          }),
        },
        referrals: {
          include: {
            referrer: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return { success: false, error: "Customer not found" };
    }

    // If user is HOST, verify they have at least one booking for their events
    if (user.role === "HOST" && customer.bookings.length === 0) {
      return {
        success: false,
        error: "You can only view customers who have booked your events",
      };
    }

    return { success: true, data: customer };
  } catch (error) {
    console.error("Error fetching customer:", error);
    return { success: false, error: "Failed to fetch customer details" };
  }
}

export async function deleteCustomer(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to delete customers",
      };
    }

    // Check user role and permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "HOST" && user.role !== "ADMIN")) {
      return {
        success: false,
        error: "Only hosts and admins can delete customers",
      };
    }

    // If user is HOST, verify the customer has booked their events
    if (user.role === "HOST") {
      const customerBookings = await db.booking.findFirst({
        where: {
          userId: id,
          event: {
            hostId: session.user.id,
          },
        },
      });

      if (!customerBookings) {
        return {
          success: false,
          error: "You can only delete customers who have booked your events",
        };
      }
    }

    await db.user.delete({
      where: {
        id,
        role: "USER",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting customer:", error);
    return { success: false, error: "Failed to delete customer" };
  }
}

export async function blockCustomer(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to block customers",
      };
    }

    // Check user role and permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "HOST" && user.role !== "ADMIN")) {
      return {
        success: false,
        error: "Only hosts and admins can block customers",
      };
    }

    // If user is HOST, verify the customer has booked their events
    if (user.role === "HOST") {
      const customerBookings = await db.booking.findFirst({
        where: {
          userId: id,
          event: {
            hostId: session.user.id,
          },
        },
      });

      if (!customerBookings) {
        return {
          success: false,
          error: "You can only block customers who have booked your events",
        };
      }
    }

    await db.user.update({
      where: {
        id,
        role: "USER",
      },
      data: {
        status: UserStatus.INACTIVE,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error blocking customer:", error);
    return { success: false, error: "Failed to block customer" };
  }
}

export async function unblockCustomer(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to unblock customers",
      };
    }

    // Check user role and permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "HOST" && user.role !== "ADMIN")) {
      return {
        success: false,
        error: "Only hosts and admins can unblock customers",
      };
    }

    // If user is HOST, verify the customer has booked their events
    if (user.role === "HOST") {
      const customerBookings = await db.booking.findFirst({
        where: {
          userId: id,
          event: {
            hostId: session.user.id,
          },
        },
      });

      if (!customerBookings) {
        return {
          success: false,
          error: "You can only unblock customers who have booked your events",
        };
      }
    }

    await db.user.update({
      where: {
        id,
        role: "USER",
      },
      data: {
        status: UserStatus.ACTIVE,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error unblocking customer:", error);
    return { success: false, error: "Failed to unblock customer" };
  }
}
