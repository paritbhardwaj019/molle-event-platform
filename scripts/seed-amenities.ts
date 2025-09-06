import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_AMENITIES = [
  {
    name: "WiFi",
    description: "High-speed wireless internet access",
    isEnabled: true,
  },
  {
    name: "Parking",
    description: "On-site parking facilities",
    isEnabled: true,
  },
  {
    name: "Food & Beverages",
    description: "Food and drinks available at the venue",
    isEnabled: true,
  },
  {
    name: "Security",
    description: "Professional security services",
    isEnabled: true,
  },
  {
    name: "First Aid",
    description: "Medical assistance and first aid facilities",
    isEnabled: true,
  },
  {
    name: "Restrooms",
    description: "Clean restroom facilities",
    isEnabled: true,
  },
  {
    name: "Air Conditioning",
    description: "Climate-controlled environment",
    isEnabled: true,
  },
  {
    name: "Wheelchair Access",
    description: "Accessible facilities for wheelchair users",
    isEnabled: true,
  },
  {
    name: "Seating",
    description: "Comfortable seating arrangements",
    isEnabled: true,
  },
  {
    name: "Audio/Visual Equipment",
    description: "Professional sound and visual equipment",
    isEnabled: true,
  },
  {
    name: "Photography",
    description: "Professional photography services",
    isEnabled: true,
  },
  {
    name: "Live Streaming",
    description: "Live streaming capabilities",
    isEnabled: true,
  },
];

async function seedAmenities() {
  console.log("🌱 Seeding amenities...");

  try {
    for (const amenity of DEFAULT_AMENITIES) {
      const existingAmenity = await prisma.amenity.findFirst({
        where: {
          name: {
            equals: amenity.name,
            mode: "insensitive",
          },
        },
      });

      if (!existingAmenity) {
        await prisma.amenity.create({
          data: amenity,
        });
        console.log(`✅ Created amenity: ${amenity.name}`);
      } else {
        console.log(`⏭️  Skipped existing amenity: ${amenity.name}`);
      }
    }

    console.log("🎉 Amenities seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding amenities:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedAmenities().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seedAmenities };
