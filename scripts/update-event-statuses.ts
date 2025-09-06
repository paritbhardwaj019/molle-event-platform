#!/usr/bin/env tsx

import { updateEventStatuses } from "@/lib/actions/event";

/**
 * Script to update event statuses based on current conditions
 * This script can be run manually or scheduled via cron job
 *
 * Usage:
 * - Manual: npx tsx scripts/update-event-statuses.ts
 * - Cron: Add to crontab to run every hour: 0 * * * * /path/to/script
 */

async function main() {
  console.log("🔄 Starting event status update...");

  try {
    const result = await updateEventStatuses();

    if (result.success) {
      console.log(`✅ Successfully updated ${result.data.updatedCount} events`);

      if (result.data.events.length > 0) {
        console.log("📋 Updated events:");
        result.data.events.forEach((event: any) => {
          console.log(`  - ${event.id}: ${event.status}`);
        });
      }
    } else {
      console.error("❌ Failed to update event statuses:", result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  }

  console.log("🏁 Event status update completed");
}

// Run the script
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}
