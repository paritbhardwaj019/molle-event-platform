"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { UserRole, PackageDuration } from "@prisma/client";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { Cashfree, CFEnvironment } from "cashfree-pg";

const cashfree = new Cashfree(
  CFEnvironment.PRODUCTION,
  process.env.CASHFREE_CLIENT_ID!,
  process.env.CASHFREE_CLIENT_SECRET!
);

export type { PackageDuration };

export type SubscriptionPackage = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  dailySwipeLimit: number;
  duration: PackageDuration;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  allowBadge: boolean;
  canSeeLikes: boolean;
  priorityMatching: boolean;
  isHidden: boolean;
  userCount?: number;
};

export type CreatePackageInput = {
  name: string;
  description?: string;
  price: number;
  dailySwipeLimit: number;
  duration: PackageDuration;
  allowBadge?: boolean;
  canSeeLikes?: boolean;
  priorityMatching?: boolean;
  isHidden?: boolean;
};

export type UpdatePackageInput = {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  dailySwipeLimit?: number;
  duration?: PackageDuration;
  isActive?: boolean;
  allowBadge?: boolean;
  canSeeLikes?: boolean;
  priorityMatching?: boolean;
  isHidden?: boolean;
};

export type PurchasePackageInput = {
  packageId: string;
};

export type CreateSubscriptionPaymentInput = {
  packageId: string;
};

export type VerifySubscriptionPaymentInput = {
  orderId: string;
  paymentId: string;
  signature: string;
};

export async function createSubscriptionPackage(input: CreatePackageInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to create a subscription package",
      };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Only admins can create subscription packages",
      };
    }

    if (!input.name || !input.price || !input.dailySwipeLimit) {
      return {
        success: false,
        error: "Name, price, and daily swipe limit are required",
      };
    }

    const package_ = await db.subscriptionPackage.create({
      data: {
        name: input.name,
        description: input.description,
        price: input.price,
        dailySwipeLimit: input.dailySwipeLimit,
        duration: input.duration,
        allowBadge: input.allowBadge || false,
        canSeeLikes: input.canSeeLikes || false,
        priorityMatching: input.priorityMatching || false,
        isHidden: input.isHidden || false,
      },
    });

    revalidatePath("/dashboard/admin/packages");

    return {
      success: true,
      data: package_,
    };
  } catch (error) {
    console.error("Error creating subscription package:", error);
    return {
      success: false,
      error: "Failed to create subscription package",
    };
  }
}

export async function getAllSubscriptionPackages() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view subscription packages",
      };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Only admins can view all subscription packages",
      };
    }

    const packages = await db.subscriptionPackage.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedPackages = packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      price: Number(pkg.price),
      dailySwipeLimit: pkg.dailySwipeLimit,
      duration: pkg.duration,
      isActive: pkg.isActive,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
      allowBadge: pkg.allowBadge,
      canSeeLikes: pkg.canSeeLikes,
      priorityMatching: pkg.priorityMatching,
      isHidden: pkg.isHidden,
      userCount: pkg._count.users,
    }));

    return {
      success: true,
      data: formattedPackages,
    };
  } catch (error) {
    console.error("Error fetching subscription packages:", error);
    return {
      success: false,
      error: "Failed to fetch subscription packages",
    };
  }
}

export async function updateSubscriptionPackage(input: UpdatePackageInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to update a subscription package",
      };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Only admins can update subscription packages",
      };
    }

    const { id, ...updateData } = input;

    const package_ = await db.subscriptionPackage.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/dashboard/admin/packages");

    return {
      success: true,
      data: package_,
    };
  } catch (error) {
    console.error("Error updating subscription package:", error);
    return {
      success: false,
      error: "Failed to update subscription package",
    };
  }
}

export async function deleteSubscriptionPackage(packageId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to delete a subscription package",
      };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Only admins can delete subscription packages",
      };
    }

    // Check if any users are currently subscribed to this package
    const activeUsers = await db.user.count({
      where: { activePackageId: packageId },
    });

    if (activeUsers > 0) {
      return {
        success: false,
        error: `Cannot delete package. ${activeUsers} users are currently subscribed to this package.`,
      };
    }

    await db.subscriptionPackage.delete({
      where: { id: packageId },
    });

    revalidatePath("/dashboard/admin/packages");

    return { success: true };
  } catch (error) {
    console.error("Error deleting subscription package:", error);
    return {
      success: false,
      error: "Failed to delete subscription package",
    };
  }
}

export async function getAvailablePackages() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view packages",
      };
    }

    const packages = await db.subscriptionPackage.findMany({
      where: {
        isActive: true,
        isHidden: false,
      },
      orderBy: { price: "asc" },
    });

    const formattedPackages = packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      price: Number(pkg.price),
      dailySwipeLimit: pkg.dailySwipeLimit,
      duration: pkg.duration,
      allowBadge: pkg.allowBadge,
      canSeeLikes: pkg.canSeeLikes,
      priorityMatching: pkg.priorityMatching,
      isHidden: pkg.isHidden,
    }));

    return {
      success: true,
      data: formattedPackages,
    };
  } catch (error) {
    console.error("Error fetching available packages:", error);
    return {
      success: false,
      error: "Failed to fetch available packages",
    };
  }
}

export async function purchaseSubscriptionPackage(input: PurchasePackageInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to purchase a package",
      };
    }

    const package_ = await db.subscriptionPackage.findUnique({
      where: { id: input.packageId, isActive: true },
    });

    if (!package_) {
      return {
        success: false,
        error: "Package not found or inactive",
      };
    }

    // Calculate subscription end date based on duration
    const now = new Date();
    let subscriptionEndDate: Date;

    switch (package_.duration) {
      case PackageDuration.MONTHLY:
        subscriptionEndDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          now.getDate()
        );
        break;
      case PackageDuration.QUARTERLY:
        subscriptionEndDate = new Date(
          now.getFullYear(),
          now.getMonth() + 3,
          now.getDate()
        );
        break;
      case PackageDuration.YEARLY:
        subscriptionEndDate = new Date(
          now.getFullYear() + 1,
          now.getMonth(),
          now.getDate()
        );
        break;
      case PackageDuration.LIFETIME:
        subscriptionEndDate = new Date(
          now.getFullYear() + 100,
          now.getMonth(),
          now.getDate()
        ); // 100 years
        break;
      default:
        subscriptionEndDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          now.getDate()
        );
    }

    // Update user's subscription
    await db.user.update({
      where: { id: session.user.id },
      data: {
        activePackageId: package_.id,
        subscriptionEndDate,
        dailySwipeRemaining: package_.dailySwipeLimit,
        freeSwipesRemaining: 3, // Reset free swipes when purchasing a package
        lastSwipeReset: now,
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        package: package_,
        subscriptionEndDate,
      },
    };
  } catch (error) {
    console.error("Error purchasing subscription package:", error);
    return {
      success: false,
      error: "Failed to purchase subscription package",
    };
  }
}

export async function resetDailySwipeLimits() {
  try {
    const users = await db.user.findMany({
      where: {
        activePackageId: { not: null },
        subscriptionEndDate: { gt: new Date() },
      },
      include: {
        activePackage: true,
      },
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const user of users) {
      const lastReset = new Date(user.lastSwipeReset);
      const lastResetDay = new Date(
        lastReset.getFullYear(),
        lastReset.getMonth(),
        lastReset.getDate()
      );

      // Reset if it's a new day
      if (lastResetDay < today) {
        await db.user.update({
          where: { id: user.id },
          data: {
            dailySwipeRemaining: user.activePackage?.dailySwipeLimit || 0,
            lastSwipeReset: now,
          },
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error resetting daily swipe limits:", error);
    return {
      success: false,
      error: "Failed to reset daily swipe limits",
    };
  }
}

export async function getUserSubscriptionStatus() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view subscription status",
      };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        activePackage: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const isSubscriptionActive =
      user.subscriptionEndDate && user.subscriptionEndDate > new Date();
    const isExpired =
      user.subscriptionEndDate && user.subscriptionEndDate <= new Date();

    return {
      success: true,
      data: {
        hasActiveSubscription: isSubscriptionActive,
        isExpired,
        activePackage: user.activePackage,
        subscriptionEndDate: user.subscriptionEndDate,
        dailySwipeRemaining: user.dailySwipeRemaining,
        freeSwipesRemaining: user.freeSwipesRemaining,
        lastSwipeReset: user.lastSwipeReset,
      },
    };
  } catch (error) {
    console.error("Error getting user subscription status:", error);
    return {
      success: false,
      error: "Failed to get subscription status",
    };
  }
}

export async function createSubscriptionPayment(
  input: CreateSubscriptionPaymentInput
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to purchase a package",
      };
    }

    const package_ = await db.subscriptionPackage.findUnique({
      where: { id: input.packageId, isActive: true },
    });

    if (!package_) {
      return {
        success: false,
        error: "Package not found or inactive",
      };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const customOrderId = `PKG_${Date.now()}_${session.user.id}`;

    const orderData = {
      order_id: customOrderId,
      order_amount: Number(package_.price),
      order_currency: "INR",
      customer_details: {
        customer_id: session.user.id,
        customer_name: user.name || "Unknown",
        customer_email: user.email!,
        customer_phone: user.phone
          ? user.phone.replace(/^\+91\s*/, "")
          : "9876543210",
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_URL}/payment-success?order_id=${customOrderId}&type=package&cf_id={cf_id}`,
      },
      order_note: `Subscription purchase for ${package_.name}`,
      order_tags: {
        pkgId: package_.id,
        uid: session.user.id,
        pkgName: package_.name,
        pkgPrice: Number(package_.price).toFixed(2),
        pkgDur: package_.duration,
        swipeLimit: package_.dailySwipeLimit.toString(),
      },
    };

    const cashfreeOrder = await createCashfreeSubscriptionOrder(orderData);

    if (!cashfreeOrder || !cashfreeOrder.cf_order_id) {
      throw new Error("Failed to create Cashfree order");
    }
    await db.subscriptionPayment.create({
      data: {
        cashfreeOrderId: customOrderId,
        amount: package_.price,
        status: "PENDING",
        userId: session.user.id,
        packageId: package_.id,
      },
    });

    return {
      success: true,
      data: {
        orderId: customOrderId,
        amount: Number(package_.price),
        currency: "INR",
        paymentSessionId: cashfreeOrder.payment_session_id,
        package: {
          id: package_.id,
          name: package_.name,
          description: package_.description,
          price: Number(package_.price),
          dailySwipeLimit: package_.dailySwipeLimit,
          duration: package_.duration,
        },
      },
    };
  } catch (error) {
    console.error("Error creating subscription payment:", error);
    return {
      success: false,
      error: "Failed to create subscription payment",
    };
  }
}

export async function verifySubscriptionPayment(
  input: VerifySubscriptionPaymentInput
) {
  try {
    // Validate input parameters
    if (!input.orderId) {
      return {
        success: false,
        error: "Order ID is required",
      };
    }

    if (!input.paymentId) {
      return {
        success: false,
        error: "Payment ID is required",
      };
    }

    const payment = await db.subscriptionPayment.update({
      where: { cashfreeOrderId: input.orderId },
      data: {
        cashfreePaymentId: input.paymentId.toString(),
        status: "COMPLETED",
      },
      include: {
        user: true,
        package: true,
      },
    });

    if (!payment) {
      return {
        success: false,
        error: "Payment not found",
      };
    }

    // Calculate subscription end date based on duration
    const now = new Date();
    let subscriptionEndDate: Date;

    switch (payment.package.duration) {
      case PackageDuration.MONTHLY:
        subscriptionEndDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          now.getDate()
        );
        break;
      case PackageDuration.QUARTERLY:
        subscriptionEndDate = new Date(
          now.getFullYear(),
          now.getMonth() + 3,
          now.getDate()
        );
        break;
      case PackageDuration.YEARLY:
        subscriptionEndDate = new Date(
          now.getFullYear() + 1,
          now.getMonth(),
          now.getDate()
        );
        break;
      case PackageDuration.LIFETIME:
        subscriptionEndDate = new Date(
          now.getFullYear() + 100,
          now.getMonth(),
          now.getDate()
        ); // 100 years
        break;
      default:
        subscriptionEndDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          now.getDate()
        );
    }

    // Update user's subscription
    await db.user.update({
      where: { id: payment.userId },
      data: {
        activePackageId: payment.packageId,
        subscriptionEndDate,
        dailySwipeRemaining: payment.package.dailySwipeLimit,
        freeSwipesRemaining: 3, // Reset free swipes when purchasing a package
        lastSwipeReset: now,
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        payment,
        subscriptionEndDate,
      },
    };
  } catch (error) {
    console.error("Error verifying subscription payment:", error);
    return {
      success: false,
      error: "Failed to verify subscription payment",
    };
  }
}

async function createCashfreeSubscriptionOrder(orderData: any) {
  try {
    const response = await cashfree.PGCreateOrder(orderData);
    return response.data;
  } catch (error) {
    console.error("Error creating Cashfree subscription order:", error);
    throw error;
  }
}

async function fetchCashfreeSubscriptionOrder(orderId: string) {
  try {
    const response = await cashfree.PGFetchOrder(orderId);
    return response.data;
  } catch (error) {
    console.error("Error fetching Cashfree subscription order:", error);
    throw error;
  }
}
