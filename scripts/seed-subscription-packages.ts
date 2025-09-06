import { PrismaClient, PackageDuration } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding subscription packages...");

  const packages = [
    {
      name: "Free Plan",
      description: "Basic access with limited daily swipes",
      price: 0,
      dailySwipeLimit: 3,
      duration: PackageDuration.MONTHLY,
      allowBadge: false,
      canSeeLikes: false,
      priorityMatching: false,
      isHidden: true,
    },
    {
      name: "Silver Plan",
      description:
        "Unlimited swipes with priority matching for better connections",
      price: 299,
      dailySwipeLimit: 999999, // Unlimited
      duration: PackageDuration.MONTHLY,
      allowBadge: false,
      canSeeLikes: false,
      priorityMatching: true,
      isHidden: false,
    },
    {
      name: "Gold Plan",
      description:
        "Premium features including gold badge, see who liked you, and priority matching",
      price: 449,
      dailySwipeLimit: 999999, // Unlimited
      duration: PackageDuration.MONTHLY,
      allowBadge: true,
      canSeeLikes: true,
      priorityMatching: true,
      isHidden: false,
    },
  ];

  for (const pkg of packages) {
    const existingPackage = await prisma.subscriptionPackage.findFirst({
      where: { name: pkg.name },
    });

    if (!existingPackage) {
      await prisma.subscriptionPackage.create({
        data: pkg,
      });
      console.log(`✅ Created package: ${pkg.name}`);
    } else {
      console.log(`⏭️  Package already exists: ${pkg.name}`);
    }
  }

  console.log("🎉 Subscription packages seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding subscription packages:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
