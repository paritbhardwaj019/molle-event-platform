import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setPopularCities() {
  try {
    console.log("Setting popular cities priorities...");

    // Define popular Indian cities with their priorities
    const popularCities = [
      { name: "Mumbai", state: "Maharashtra", priority: 100 },
      { name: "Delhi", state: "Delhi", priority: 99 },
      { name: "Bangalore", state: "Karnataka", priority: 98 },
      { name: "Chennai", state: "Tamil Nadu", priority: 97 },
      { name: "Kolkata", state: "West Bengal", priority: 96 },
      { name: "Hyderabad", state: "Telangana", priority: 95 },
      { name: "Pune", state: "Maharashtra", priority: 94 },
      { name: "Ahmedabad", state: "Gujarat", priority: 93 },
      { name: "Jaipur", state: "Rajasthan", priority: 92 },
      { name: "Surat", state: "Gujarat", priority: 91 },
      { name: "Lucknow", state: "Uttar Pradesh", priority: 90 },
      { name: "Kanpur", state: "Uttar Pradesh", priority: 89 },
      { name: "Nagpur", state: "Maharashtra", priority: 88 },
      { name: "Indore", state: "Madhya Pradesh", priority: 87 },
      { name: "Thane", state: "Maharashtra", priority: 86 },
      { name: "Bhopal", state: "Madhya Pradesh", priority: 85 },
      { name: "Visakhapatnam", state: "Andhra Pradesh", priority: 84 },
      { name: "Pimpri-Chinchwad", state: "Maharashtra", priority: 83 },
      { name: "Patna", state: "Bihar", priority: 82 },
      { name: "Vadodara", state: "Gujarat", priority: 81 },
    ];

    // Update priorities for existing cities
    for (const cityData of popularCities) {
      const result = await prisma.city.updateMany({
        where: {
          name: cityData.name,
          state: cityData.state,
        },
        data: {
          priority: cityData.priority,
        },
      });

      if (result.count > 0) {
        console.log(
          `✅ Updated priority for ${cityData.name}, ${cityData.state} to ${cityData.priority}`
        );
      } else {
        console.log(`⚠️  City not found: ${cityData.name}, ${cityData.state}`);
      }
    }

    console.log("✅ Popular cities priorities set successfully!");
  } catch (error) {
    console.error("❌ Error setting popular cities:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setPopularCities();
