import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Starting daily swipe reset...");

  try {
    // Get all users with active subscriptions
    const users = await prisma.user.findMany({
      where: {
        activePackageId: { not: null },
        subscriptionEndDate: { gt: new Date() },
      },
      include: {
        activePackage: true,
      },
    });

    console.log(`Found ${users.length} users with active subscriptions`);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let resetCount = 0;

    for (const user of users) {
      const lastReset = new Date(user.lastSwipeReset);
      const lastResetDay = new Date(
        lastReset.getFullYear(),
        lastReset.getMonth(),
        lastReset.getDate()
      );

      // Reset if it's a new day
      if (lastResetDay < today) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            dailySwipeRemaining: user.activePackage?.dailySwipeLimit || 0,
            freeSwipesRemaining: 3, // Reset free swipes daily
            lastSwipeReset: now,
          },
        });
        resetCount++;
        console.log(`✅ Reset swipes for user: ${user.name} (${user.email})`);
      }
    }

    console.log(`🎉 Daily swipe reset completed! Reset ${resetCount} users.`);
  } catch (error) {
    console.error("❌ Error resetting daily swipes:", error);
    process.exit(1);
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
