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
    key: "user_fee_percentage",
    value: "5",
    displayName: "User Fee (%)",
    description: "Percentage added to base ticket price that user pays",
  },
  {
    key: "host_fee_percentage",
    value: "6",
    displayName: "Host Fee (%)",
    description: "Percentage deducted from base ticket price for host payout",
  },
  {
    key: "platform_fee_percentage",
    value: "0",
    displayName: "Platform Fee (%)",
    description: "Fixed platform fee (not editable)",
  },
  {
    key: "cgst_percentage",
    value: "9",
    displayName: "CGST (%)",
    description: "Central Goods and Services Tax percentage",
  },
  {
    key: "sgst_percentage",
    value: "9",
    displayName: "SGST (%)",
    description: "State Goods and Services Tax percentage",
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

    // Update each setting (except platform_fee_percentage which is fixed)
    for (const [key, value] of Object.entries(settingsData)) {
      if (key === "platform_fee_percentage") {
        continue; // Skip platform fee as it's fixed
      }

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

export async function calculateFees(eventSlugOrData?: string | any) {
  const userFeePercentage = parseFloat(
    await getSetting("user_fee_percentage", "5")
  );
  const platformHostFeePercentage = parseFloat(
    await getSetting("host_fee_percentage", "6")
  );
  const platformFeePercentage = parseFloat(
    await getSetting("platform_fee_percentage", "0")
  );
  const cgstPercentage = parseFloat(await getSetting("cgst_percentage", "9"));
  const sgstPercentage = parseFloat(await getSetting("sgst_percentage", "9"));

  let event = null;
  let baseTicketPrice = 100; // Default fallback
  let referralPercentage = 0; // Default referral percentage
  let hostFeePercentage = platformHostFeePercentage; // Default to platform fee

  // If eventSlugOrData is provided, get the event data
  if (eventSlugOrData) {
    if (typeof eventSlugOrData === "string") {
      // It's a slug, fetch the event
      try {
        event = await db.event.findUnique({
          where: { slug: eventSlugOrData },
          include: {
            host: {
              select: {
                hostFeePercentage: true,
              },
            },
            packages: {
              orderBy: {
                price: "asc",
              },
            },
          },
        });
      } catch (error) {
        console.error("Error fetching event by slug:", error);
      }
    } else if (eventSlugOrData.packages) {
      // It's event data
      event = eventSlugOrData;
    }

    // Get the minimum package price as base price and referral percentage
    if (event && event.packages && event.packages.length > 0) {
      const minPrice = Math.min(
        ...event.packages.map((pkg: any) => Number(pkg.price))
      );
      baseTicketPrice = minPrice;
      referralPercentage = Number(event.referralPercentage || 0);

      // Use host-specific fee percentage if available
      if (event.host && event.host.hostFeePercentage !== null) {
        hostFeePercentage = Number(event.host.hostFeePercentage);
      }
    }
  }

  // Calculate all fees and taxes based on actual package price
  const userFeeAmount = baseTicketPrice * (userFeePercentage / 100);
  const hostFeeAmount = baseTicketPrice * (hostFeePercentage / 100);
  const platformFeeAmount = baseTicketPrice * (platformFeePercentage / 100);
  const cgstAmount = baseTicketPrice * (cgstPercentage / 100);
  const sgstAmount = baseTicketPrice * (sgstPercentage / 100);
  const totalTaxAmount = cgstAmount + sgstAmount;

  // User pays: Base price + user fee + taxes
  const userPays = baseTicketPrice + userFeeAmount + totalTaxAmount;

  // Host gets: Base price - host fee (before referral deduction)
  const hostGetsBeforeReferral = baseTicketPrice - hostFeeAmount;

  // Referral calculation (deducted from host's share)
  const referralAmount = hostGetsBeforeReferral * (referralPercentage / 100);
  const hostGets = hostGetsBeforeReferral - referralAmount;

  // Admin gets: User fee + host fee + platform fee
  const adminGets = userFeeAmount + hostFeeAmount + platformFeeAmount;

  return {
    ticketPrice: baseTicketPrice,
    userFeePercentage,
    hostFeePercentage,
    platformFeePercentage,
    cgstPercentage,
    sgstPercentage,
    referralPercentage,
    userFeeAmount,
    hostFeeAmount,
    platformFeeAmount,
    cgstAmount,
    sgstAmount,
    totalTaxAmount,
    referralAmount,
    userPays,
    hostGets,
    hostGetsBeforeReferral,
    adminGets,
  };
}
