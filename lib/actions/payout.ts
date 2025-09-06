"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PayoutStatus, UserRole } from "@prisma/client";
import { Prisma } from "@prisma/client";
import {
  sendPayoutRequestedEmail,
  sendPayoutApprovedEmail,
  sendPayoutRejectedEmail,
} from "@/lib/email";

export type PayoutRequest = {
  id: string;
  amount: number;
  status: PayoutStatus;
  requestedAt: Date;
  processedAt: Date | null;
  accountNumber: string | null;
  ifscCode: string | null;
  accountName: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    walletBalance: number;
    phone: string | null;
  };
};

export async function requestWithdrawal(
  amount: number,
  bankAccountId?: string
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
        kycRequests: {
          where: {
            status: "APPROVED",
          },
          take: 1,
        },
      },
    });

    if (!user || (user.role !== "HOST" && user.role !== "REFERRER")) {
      return {
        success: false,
        error: "Only hosts and referrers can request withdrawals",
      };
    }

    // Check KYC approval for hosts
    if (user.role === "HOST") {
      const hasApprovedKyc = user.kycRequests.length > 0;
      if (!hasApprovedKyc) {
        return {
          success: false,
          error:
            "KYC verification required. Please complete your KYC to request withdrawals.",
        };
      }
    }

    // Check bank account for referrers
    if (user.role === "REFERRER") {
      if (!bankAccountId) {
        return {
          success: false,
          error: "Bank account is required for referrers",
        };
      }

      // Verify bank account belongs to user
      const bankAccount = await db.bankAccount.findUnique({
        where: {
          id: bankAccountId,
          userId: session.user.id,
        },
      });

      if (!bankAccount) {
        return {
          success: false,
          error: "Invalid bank account",
        };
      }
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

    // If referrer, get bank account details
    let accountNumber = null;
    let ifscCode = null;
    let accountName = null;

    if (user.role === "REFERRER" && bankAccountId) {
      const bankAccount = await db.bankAccount.findUnique({
        where: {
          id: bankAccountId,
        },
        select: {
          accountNumber: true,
          ifscCode: true,
          accountName: true,
        },
      });

      if (bankAccount) {
        accountNumber = bankAccount.accountNumber;
        ifscCode = bankAccount.ifscCode;
        accountName = bankAccount.accountName;
      }
    }

    // Create payout request
    const payout = await db.payout.create({
      data: {
        amount: amount,
        status: "PENDING",
        userId: session.user.id,
        accountNumber,
        ifscCode,
        accountName,
      },
    });

    // Get user details for email
    const userDetails = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
      },
    });

    // Send email notification to user
    if (userDetails?.email && userDetails?.name) {
      await sendPayoutRequestedEmail(
        userDetails.name,
        userDetails.email,
        amount.toString(),
        payout.id
      );
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
            kycRequests: {
              where: {
                status: "APPROVED",
              },
              select: {
                accountNumber: true,
                bankName: true,
                bankBranch: true,
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    const formattedPayouts: PayoutRequest[] = payouts.map((payout) => {
      // For hosts, get bank details from KYC if payout doesn't have them
      let accountNumber = payout.accountNumber;
      let bankName = null;
      let bankBranch = null;

      if (
        payout.user.role === "HOST" &&
        !accountNumber &&
        payout.user.kycRequests.length > 0
      ) {
        const kyc = payout.user.kycRequests[0];
        accountNumber = kyc.accountNumber;
        bankName = kyc.bankName;
        bankBranch = kyc.bankBranch;
      }

      return {
        id: payout.id,
        amount: Number(payout.amount),
        status: payout.status,
        requestedAt: payout.requestedAt,
        processedAt: payout.processedAt,
        accountNumber: payout.accountNumber || accountNumber,
        ifscCode: payout.ifscCode,
        accountName:
          payout.accountName ||
          (bankName ? `${bankName} (${bankBranch})` : null),
        user: {
          id: payout.user.id,
          name: payout.user.name,
          email: payout.user.email,
          role: payout.user.role,
          walletBalance: Number(payout.user.walletBalance),
          phone: payout.user.phone,
        },
      };
    });

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
            kycRequests: {
              where: {
                status: "APPROVED",
              },
              select: {
                accountNumber: true,
                bankName: true,
                bankBranch: true,
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    const formattedPayouts: PayoutRequest[] = payouts.map((payout) => {
      // For hosts, get bank details from KYC if payout doesn't have them
      let accountNumber = payout.accountNumber;
      let bankName = null;
      let bankBranch = null;

      if (
        payout.user.role === "HOST" &&
        !accountNumber &&
        payout.user.kycRequests.length > 0
      ) {
        const kyc = payout.user.kycRequests[0];
        accountNumber = kyc.accountNumber;
        bankName = kyc.bankName;
        bankBranch = kyc.bankBranch;
      }

      return {
        id: payout.id,
        amount: Number(payout.amount),
        status: payout.status,
        requestedAt: payout.requestedAt,
        processedAt: payout.processedAt,
        accountNumber: payout.accountNumber || accountNumber,
        ifscCode: payout.ifscCode,
        accountName:
          payout.accountName ||
          (bankName ? `${bankName} (${bankBranch})` : null),
        user: {
          id: payout.user.id,
          name: payout.user.name,
          email: payout.user.email,
          role: payout.user.role,
          walletBalance: Number(payout.user.walletBalance),
          phone: payout.user.phone,
        },
      };
    });

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

    // Get the payout request with user details
    const payout = await db.payout.findUnique({
      where: { id: payoutId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            walletBalance: true,
            role: true,
            kycRequests: {
              where: {
                status: "APPROVED",
              },
              select: {
                accountNumber: true,
                bankName: true,
                bankBranch: true,
              },
              take: 1,
            },
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

    // Prepare bank details for email
    let accountNumber = payout.accountNumber;
    let bankName = null;

    if (
      payout.user.role === "HOST" &&
      !accountNumber &&
      payout.user.kycRequests.length > 0
    ) {
      const kyc = payout.user.kycRequests[0];
      accountNumber = kyc.accountNumber;
      bankName = kyc.bankName ? `${kyc.bankName} (${kyc.bankBranch})` : null;
    }

    // Send email notification to user
    if (payout.user.email && payout.user.name) {
      await sendPayoutApprovedEmail(
        payout.user.name,
        payout.user.email,
        payoutAmount.toString(),
        accountNumber || undefined,
        bankName || undefined
      );
    }

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

    // Get the payout request with user details
    const payout = await db.payout.findUnique({
      where: { id: payoutId },
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

    // Send email notification to user
    if (payout.user.email && payout.user.name) {
      await sendPayoutRejectedEmail(
        payout.user.name,
        payout.user.email,
        Number(payout.amount).toString()
      );
    }

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
