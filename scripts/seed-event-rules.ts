import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedEventRules() {
  const sampleRules = [
    {
      title: "Age Verification Required",
      description:
        "All attendees must be 18+ years old and present valid government-issued photo ID at the venue entrance. No exceptions will be made.",
      isActive: true,
      order: 1,
    },
    {
      title: "No Outside Food or Beverages",
      description:
        "Outside food and beverages are strictly prohibited. Food and drinks will be available for purchase at the venue.",
      isActive: true,
      order: 2,
    },
    {
      title: "Dress Code Policy",
      description:
        "Smart casual dress code is required. No flip-flops, shorts, or tank tops allowed. Management reserves the right to refuse entry for inappropriate attire.",
      isActive: true,
      order: 3,
    },
    {
      title: "No Smoking Policy",
      description:
        "Smoking is strictly prohibited inside the venue. Designated smoking areas are available outside the main entrance.",
      isActive: true,
      order: 4,
    },
    {
      title: "Photography and Recording",
      description:
        "Professional photography and video recording equipment are not allowed without prior written consent from event management.",
      isActive: true,
      order: 5,
    },
    {
      title: "Security Screening",
      description:
        "All attendees will be subject to security screening including bag checks. Prohibited items will be confiscated and not returned.",
      isActive: true,
      order: 6,
    },
  ];

  console.log("Seeding event rules...");

  for (const rule of sampleRules) {
    const existingRule = await prisma.eventRule.findFirst({
      where: { title: rule.title },
    });

    if (existingRule) {
      await prisma.eventRule.update({
        where: { id: existingRule.id },
        data: rule,
      });
      console.log(`✓ Updated rule: ${rule.title}`);
    } else {
      await prisma.eventRule.create({
        data: rule,
      });
      console.log(`✓ Created rule: ${rule.title}`);
    }
  }

  console.log("Event rules seeding completed!");
}

seedEventRules()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
