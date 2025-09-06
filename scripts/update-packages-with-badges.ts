import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updatePackagesWithBadges() {
  try {
    const updatedPackages = await prisma.subscriptionPackage.updateMany({
      where: {
        OR: [
          { name: { contains: "Premium" } },
          { name: { contains: "Pro" } },
          { name: { contains: "Gold" } },
          { price: { gte: 500 } },
        ],
      },
      data: {
        allowBadge: true,
      },
    });

    const allPackages = await prisma.subscriptionPackage.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        allowBadge: true,
      },
      orderBy: {
        price: "asc",
      },
    });

    allPackages.forEach((pkg) => {
      console.log(
        `- ${pkg.name}: ₹${pkg.price} ${
          pkg.allowBadge ? "✅ Badge Enabled" : "❌ No Badge"
        }`
      );
    });
  } catch (error) {
    console.error("Error updating packages:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePackagesWithBadges();
