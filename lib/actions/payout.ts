"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PayoutStatus, UserRole } from "@prisma/client";
import { Prisma } from "@prisma/client";

export type BankDetails = {
  accountNumber: string;
  ifscCode: string;
  accountName: string;
  phone: string;
};

export type PayoutRequest = {
  id: string;
  amount: number;
  status: PayoutStatus;
  accountNumber: string | null;
  ifscCode: string | null;
  accountName: string | null;
  phone: string | null;
  requestedAt: Date;
  processedAt: Date | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    walletBalance: number;
  };
};

export async function getUserBankDetails() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view bank details",
      };
    }

    // Get the latest payout request to get bank details
    const latestPayout = await db.payout.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        requestedAt: "desc",
      },
      select: {
        accountNumber: true,
        ifscCode: true,
        accountName: true,
        user: {
          select: {
            phone: true,
          },
        },
      },
    });

    return {
      success: true,
      data: latestPayout
        ? {
            accountNumber: latestPayout.accountNumber || "",
            ifscCode: latestPayout.ifscCode || "",
            accountName: latestPayout.accountName || "",
            phone: latestPayout.user.phone || "",
          }
        : null,
    };
  } catch (error) {
    console.error("Error fetching bank details:", error);
    return {
      success: false,
      error: "Failed to fetch bank details",
    };
  }
}

export async function requestWithdrawal(
  amount: number,
  bankDetails: BankDetails
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to request withdrawal",
      };
    }

    // Check if user is HOST or REFERRER
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        walletBalance: true,
        phone: true,
      },
    });

    if (!user || (user.role !== "HOST" && user.role !== "REFERRER")) {
      return {
        success: false,
        error: "Only hosts and referrers can request withdrawals",
      };
    }

    const walletBalance = Number(user.walletBalance);

    // Check if user has sufficient balance
    if (walletBalance < amount) {
      return {
        success: false,
        error: "Insufficient wallet balance",
      };
    }

    // Minimum withdrawal amount check
    if (amount < 100) {
      return {
        success: false,
        error: "Minimum withdrawal amount is ₹100",
      };
    }

    // Check for pending withdrawal requests
    const pendingPayout = await db.payout.findFirst({
      where: {
        userId: session.user.id,
        status: "PENDING",
      },
    });

    if (pendingPayout) {
      return {
        success: false,
        error: "You already have a pending withdrawal request",
      };
    }

    // Create payout request
    const payout = await db.payout.create({
      data: {
        amount: amount,
        status: "PENDING",
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        accountName: bankDetails.accountName,
        userId: session.user.id,
      },
    });

    // Update user's phone if provided and different
    if (bankDetails.phone && bankDetails.phone !== user.phone) {
      await db.user.update({
        where: { id: session.user.id },
        data: { phone: bankDetails.phone },
      });
    }

    return {
      success: true,
      data: {
        id: payout.id,
        amount: Number(payout.amount),
        status: payout.status,
      },
    };
  } catch (error) {
    console.error("Error requesting withdrawal:", error);
    return {
      success: false,
      error: "Failed to request withdrawal",
    };
  }
}

export async function getAllPayoutRequests() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view payout requests",
      };
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only admins can view all payout requests",
      };
    }

    const payouts = await db.payout.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            walletBalance: true,
            phone: true,
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    const formattedPayouts: PayoutRequest[] = payouts.map((payout) => ({
      id: payout.id,
      amount: Number(payout.amount),
      status: payout.status,
      accountNumber: payout.accountNumber,
      ifscCode: payout.ifscCode,
      accountName: payout.accountName,
      phone: payout.user.phone,
      requestedAt: payout.requestedAt,
      processedAt: payout.processedAt,
      user: {
        id: payout.user.id,
        name: payout.user.name,
        email: payout.user.email,
        role: payout.user.role,
        walletBalance: Number(payout.user.walletBalance),
      },
    }));

    return {
      success: true,
      data: formattedPayouts,
    };
  } catch (error) {
    console.error("Error fetching payout requests:", error);
    return {
      success: false,
      error: "Failed to fetch payout requests",
    };
  }
}

export async function getUserPayoutRequests() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view your payout requests",
      };
    }

    const payouts = await db.payout.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            walletBalance: true,
            phone: true,
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    const formattedPayouts: PayoutRequest[] = payouts.map((payout) => ({
      id: payout.id,
      amount: Number(payout.amount),
      status: payout.status,
      accountNumber: payout.accountNumber,
      ifscCode: payout.ifscCode,
      accountName: payout.accountName,
      phone: payout.user.phone,
      requestedAt: payout.requestedAt,
      processedAt: payout.processedAt,
      user: {
        id: payout.user.id,
        name: payout.user.name,
        email: payout.user.email,
        role: payout.user.role,
        walletBalance: Number(payout.user.walletBalance),
      },
    }));

    return {
      success: true,
      data: formattedPayouts,
    };
  } catch (error) {
    console.error("Error fetching user payout requests:", error);
    return {
      success: false,
      error: "Failed to fetch your payout requests",
    };
  }
}

export async function approvePayoutRequest(payoutId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to approve payouts",
      };
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only admins can approve payout requests",
      };
    }

    // Get the payout request
    const payout = await db.payout.findUnique({
      where: { id: payoutId },
      include: {
        user: {
          select: {
            id: true,
            walletBalance: true,
          },
        },
      },
    });

    if (!payout) {
      return {
        success: false,
        error: "Payout request not found",
      };
    }

    if (payout.status !== "PENDING") {
      return {
        success: false,
        error: "Payout request is not pending",
      };
    }

    const walletBalance = Number(payout.user.walletBalance);
    const payoutAmount = Number(payout.amount);

    // Check if user still has sufficient balance
    if (walletBalance < payoutAmount) {
      return {
        success: false,
        error: "User has insufficient wallet balance",
      };
    }

    // Update payout status and deduct from wallet
    await db.$transaction([
      db.payout.update({
        where: { id: payoutId },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
        },
      }),
      db.user.update({
        where: { id: payout.userId },
        data: {
          walletBalance: {
            decrement: payoutAmount,
          },
        },
      }),
    ]);

    return {
      success: true,
      message: "Payout request approved successfully",
    };
  } catch (error) {
    console.error("Error approving payout request:", error);
    return {
      success: false,
      error: "Failed to approve payout request",
    };
  }
}

export async function rejectPayoutRequest(payoutId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to reject payouts",
      };
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only admins can reject payout requests",
      };
    }

    // Get the payout request
    const payout = await db.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      return {
        success: false,
        error: "Payout request not found",
      };
    }

    if (payout.status !== "PENDING") {
      return {
        success: false,
        error: "Payout request is not pending",
      };
    }

    // Update payout status
    await db.payout.update({
      where: { id: payoutId },
      data: {
        status: "FAILED",
        processedAt: new Date(),
      },
    });

    return {
      success: true,
      message: "Payout request rejected successfully",
    };
  } catch (error) {
    console.error("Error rejecting payout request:", error);
    return {
      success: false,
      error: "Failed to reject payout request",
    };
  }
}
