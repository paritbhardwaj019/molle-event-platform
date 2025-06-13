"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export interface PlatformSettingWithMeta {
  id: string;
  key: string;
  value: string;
  displayName: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Default settings to ensure we always have the required settings
const DEFAULT_SETTINGS = [
  {
    key: "cgst_percentage",
    value: "9",
    displayName: "CGST (%)",
    description:
      "Central Goods and Services Tax percentage applied to ticket sales",
  },
  {
    key: "sgst_percentage",
    value: "9",
    displayName: "SGST (%)",
    description:
      "State Goods and Services Tax percentage applied to ticket sales",
  },
  {
    key: "platform_fee_percentage",
    value: "10",
    displayName: "Platform Fee (%)",
    description:
      "Percentage fee charged to end-users on top of the ticket price",
  },
  {
    key: "host_fee_percentage",
    value: "40",
    displayName: "Host Fee (%)",
    description: "Percentage of the platform fee that goes to the host",
  },
];

export async function getSettings() {
  try {
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Get all settings from the database
    let settings = await db.platformSetting.findMany();

    // If we're missing any of the default settings, create them
    if (settings.length < DEFAULT_SETTINGS.length) {
      for (const defaultSetting of DEFAULT_SETTINGS) {
        const existingSetting = settings.find(
          (s) => s.key === defaultSetting.key
        );

        if (!existingSetting) {
          await db.platformSetting.create({
            data: defaultSetting,
          });
        }
      }

      // Reload settings after creating defaults
      settings = await db.platformSetting.findMany();
    }

    return { success: true, data: settings };
  } catch (error) {
    console.error("Error fetching platform settings:", error);
    return { success: false, error: "Failed to fetch settings" };
  }
}

export async function updateSettings(settingsData: Record<string, string>) {
  try {
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Validate all values are proper percentages
    for (const [key, value] of Object.entries(settingsData)) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        return {
          success: false,
          error: `Invalid percentage value for ${key}: Must be between 0 and 100`,
        };
      }
    }

    // Get existing settings
    const existingSettings = await db.platformSetting.findMany({
      where: {
        key: {
          in: Object.keys(settingsData),
        },
      },
    });

    // Update each setting
    for (const [key, value] of Object.entries(settingsData)) {
      const setting = existingSettings.find((s) => s.key === key);

      if (setting) {
        await db.platformSetting.update({
          where: { id: setting.id },
          data: { value },
        });
      }
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating platform settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}

export async function getSetting(key: string, defaultValue: string = "0") {
  try {
    const setting = await db.platformSetting.findUnique({
      where: { key },
    });

    return setting?.value || defaultValue;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return defaultValue;
  }
}

export async function calculateFees(amount: number) {
  const platformFeePercentage = parseFloat(
    await getSetting("platform_fee_percentage", "10")
  );
  const hostFeePercentage = parseFloat(
    await getSetting("host_fee_percentage", "40")
  );
  const cgstPercentage = parseFloat(await getSetting("cgst_percentage", "9"));
  const sgstPercentage = parseFloat(await getSetting("sgst_percentage", "9"));

  const totalPlatformFee = amount * (platformFeePercentage / 100);

  const userPlatformFee = totalPlatformFee / 2;
  const hostPlatformFee = totalPlatformFee / 2;

  const hostFee = totalPlatformFee * (hostFeePercentage / 100);

  const adminFee = totalPlatformFee - hostFee;

  const taxableAmount = amount + userPlatformFee;
  const cgst = taxableAmount * (cgstPercentage / 100);
  const sgst = taxableAmount * (sgstPercentage / 100);

  const userPays = amount + userPlatformFee + cgst + sgst;
  const hostGets = amount - hostPlatformFee;

  return {
    baseAmount: amount,
    totalPlatformFee,
    userPlatformFee,
    hostPlatformFee,
    hostFee,
    adminFee,
    cgst,
    sgst,
    userPays,
    hostGets,
  };
}
