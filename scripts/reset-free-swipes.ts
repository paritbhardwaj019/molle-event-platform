import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Starting free swipes reset...");

  try {
    // Reset free swipes for all users
    const result = await prisma.user.updateMany({
      data: {
        freeSwipesRemaining: 3,
      },
    });

    console.log(`✅ Reset free swipes for ${result.count} users`);
    console.log("🎉 Free swipes reset completed!");
  } catch (error) {
    console.error("❌ Error resetting free swipes:", error);
    process.exit(1);
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
