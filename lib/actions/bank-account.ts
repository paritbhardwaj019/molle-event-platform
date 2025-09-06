"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const bankAccountSchema = z.object({
  accountNumber: z.string().min(1, "Account number is required"),
  ifscCode: z.string().min(1, "IFSC code is required"),
  accountName: z.string().min(1, "Account holder name is required"),
  bankName: z.string().min(1, "Bank name is required"),
  isDefault: z.boolean().default(false),
});

export type BankAccountFormData = z.infer<typeof bankAccountSchema>;

export type BankAccount = {
  id: string;
  accountNumber: string;
  ifscCode: string;
  accountName: string;
  bankName: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function addBankAccount(data: BankAccountFormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to add a bank account",
      };
    }

    // Check if user is REFERRER
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "REFERRER") {
      return {
        success: false,
        error: "Only referrers can add bank accounts",
      };
    }

    // If this is set as default, unset any existing default
    if (data.isDefault) {
      await db.bankAccount.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Check if this is the first account, if so make it default
    const accountCount = await db.bankAccount.count({
      where: {
        userId: session.user.id,
      },
    });

    const isDefault = accountCount === 0 ? true : data.isDefault;

    const bankAccount = await db.bankAccount.create({
      data: {
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        accountName: data.accountName,
        bankName: data.bankName,
        isDefault,
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard/payments");

    return {
      success: true,
      data: bankAccount,
    };
  } catch (error) {
    console.error("Error adding bank account:", error);
    return {
      success: false,
      error: "Failed to add bank account",
    };
  }
}

export async function getUserBankAccounts() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view your bank accounts",
      };
    }

    const bankAccounts = await db.bankAccount.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [
        {
          isDefault: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return {
      success: true,
      data: bankAccounts,
    };
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return {
      success: false,
      error: "Failed to fetch bank accounts",
    };
  }
}

export async function setDefaultBankAccount(accountId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to update bank accounts",
      };
    }

    // Verify ownership of the account
    const account = await db.bankAccount.findUnique({
      where: {
        id: accountId,
      },
    });

    if (!account || account.userId !== session.user.id) {
      return {
        success: false,
        error: "Bank account not found or you don't have permission",
      };
    }

    // Unset any existing default
    await db.bankAccount.updateMany({
      where: {
        userId: session.user.id,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    // Set this account as default
    await db.bankAccount.update({
      where: {
        id: accountId,
      },
      data: {
        isDefault: true,
      },
    });

    revalidatePath("/dashboard/payments");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error setting default bank account:", error);
    return {
      success: false,
      error: "Failed to set default bank account",
    };
  }
}

export async function deleteBankAccount(accountId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to delete bank accounts",
      };
    }

    // Verify ownership of the account
    const account = await db.bankAccount.findUnique({
      where: {
        id: accountId,
      },
    });

    if (!account || account.userId !== session.user.id) {
      return {
        success: false,
        error: "Bank account not found or you don't have permission",
      };
    }

    // Delete the account
    await db.bankAccount.delete({
      where: {
        id: accountId,
      },
    });

    // If this was the default account, set another as default if available
    if (account.isDefault) {
      const nextAccount = await db.bankAccount.findFirst({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (nextAccount) {
        await db.bankAccount.update({
          where: {
            id: nextAccount.id,
          },
          data: {
            isDefault: true,
          },
        });
      }
    }

    revalidatePath("/dashboard/payments");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting bank account:", error);
    return {
      success: false,
      error: "Failed to delete bank account",
    };
  }
}
