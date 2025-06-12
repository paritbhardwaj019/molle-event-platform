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
    if (
      !session ||
      (session.user.role !== "HOST" && session.user.role !== "ADMIN")
    ) {
      return { error: "Unauthorized" };
    }

    const customers = await db.user.findMany({
      where: {
        role: "USER",
      },
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
          },
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
    return { error: "Failed to fetch customers" };
  }
}

export async function getCustomerById(id: string) {
  try {
    const session = await auth();
    if (
      !session ||
      (session.user.role !== "HOST" && session.user.role !== "ADMIN")
    ) {
      return { error: "Unauthorized" };
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
      return { error: "Customer not found" };
    }

    return { success: true, data: customer };
  } catch (error) {
    console.error("Error fetching customer:", error);
    return { error: "Failed to fetch customer details" };
  }
}

export async function deleteCustomer(id: string) {
  try {
    const session = await auth();
    if (
      !session ||
      (session.user.role !== "HOST" && session.user.role !== "ADMIN")
    ) {
      return { error: "Unauthorized" };
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
    return { error: "Failed to delete customer" };
  }
}

export async function blockCustomer(id: string) {
  try {
    const session = await auth();
    if (
      !session ||
      (session.user.role !== "HOST" && session.user.role !== "ADMIN")
    ) {
      return { error: "Unauthorized" };
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
    return { error: "Failed to block customer" };
  }
}

export async function unblockCustomer(id: string) {
  try {
    const session = await auth();
    if (
      !session ||
      (session.user.role !== "HOST" && session.user.role !== "ADMIN")
    ) {
      return { error: "Unauthorized" };
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
    return { error: "Failed to unblock customer" };
  }
}
