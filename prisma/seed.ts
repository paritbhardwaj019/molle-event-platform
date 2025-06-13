import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const indianCities = [
  // Maharashtra
  { name: "Mumbai", state: "Maharashtra" },
  { name: "Pune", state: "Maharashtra" },
  { name: "Nagpur", state: "Maharashtra" },
  { name: "Nashik", state: "Maharashtra" },
  { name: "Aurangabad", state: "Maharashtra" },
  { name: "Solapur", state: "Maharashtra" },
  { name: "Thane", state: "Maharashtra" },
  { name: "Kolhapur", state: "Maharashtra" },
  { name: "Sangli", state: "Maharashtra" },
  { name: "Navi Mumbai", state: "Maharashtra" },

  // Delhi
  { name: "New Delhi", state: "Delhi" },
  { name: "Delhi", state: "Delhi" },

  // Karnataka
  { name: "Bangalore", state: "Karnataka" },
  { name: "Mysore", state: "Karnataka" },
  { name: "Hubli", state: "Karnataka" },
  { name: "Mangalore", state: "Karnataka" },
  { name: "Belgaum", state: "Karnataka" },
  { name: "Gulbarga", state: "Karnataka" },
  { name: "Davangere", state: "Karnataka" },
  { name: "Bellary", state: "Karnataka" },
  { name: "Bijapur", state: "Karnataka" },
  { name: "Shimoga", state: "Karnataka" },

  // Tamil Nadu
  { name: "Chennai", state: "Tamil Nadu" },
  { name: "Coimbatore", state: "Tamil Nadu" },
  { name: "Madurai", state: "Tamil Nadu" },
  { name: "Tiruchirappalli", state: "Tamil Nadu" },
  { name: "Salem", state: "Tamil Nadu" },
  { name: "Tirunelveli", state: "Tamil Nadu" },
  { name: "Erode", state: "Tamil Nadu" },
  { name: "Vellore", state: "Tamil Nadu" },
  { name: "Thoothukudi", state: "Tamil Nadu" },
  { name: "Dindigul", state: "Tamil Nadu" },

  // West Bengal
  { name: "Kolkata", state: "West Bengal" },
  { name: "Howrah", state: "West Bengal" },
  { name: "Durgapur", state: "West Bengal" },
  { name: "Asansol", state: "West Bengal" },
  { name: "Siliguri", state: "West Bengal" },
  { name: "Malda", state: "West Bengal" },
  { name: "Bardhaman", state: "West Bengal" },
  { name: "Kharagpur", state: "West Bengal" },

  // Gujarat
  { name: "Ahmedabad", state: "Gujarat" },
  { name: "Surat", state: "Gujarat" },
  { name: "Vadodara", state: "Gujarat" },
  { name: "Rajkot", state: "Gujarat" },
  { name: "Bhavnagar", state: "Gujarat" },
  { name: "Jamnagar", state: "Gujarat" },
  { name: "Junagadh", state: "Gujarat" },
  { name: "Gandhinagar", state: "Gujarat" },
  { name: "Anand", state: "Gujarat" },
  { name: "Morbi", state: "Gujarat" },

  // Rajasthan
  { name: "Jaipur", state: "Rajasthan" },
  { name: "Jodhpur", state: "Rajasthan" },
  { name: "Udaipur", state: "Rajasthan" },
  { name: "Kota", state: "Rajasthan" },
  { name: "Bikaner", state: "Rajasthan" },
  { name: "Ajmer", state: "Rajasthan" },
  { name: "Bhilwara", state: "Rajasthan" },
  { name: "Alwar", state: "Rajasthan" },
  { name: "Bharatpur", state: "Rajasthan" },
  { name: "Sikar", state: "Rajasthan" },

  // Uttar Pradesh
  { name: "Lucknow", state: "Uttar Pradesh" },
  { name: "Kanpur", state: "Uttar Pradesh" },
  { name: "Ghaziabad", state: "Uttar Pradesh" },
  { name: "Agra", state: "Uttar Pradesh" },
  { name: "Meerut", state: "Uttar Pradesh" },
  { name: "Varanasi", state: "Uttar Pradesh" },
  { name: "Allahabad", state: "Uttar Pradesh" },
  { name: "Bareilly", state: "Uttar Pradesh" },
  { name: "Aligarh", state: "Uttar Pradesh" },
  { name: "Moradabad", state: "Uttar Pradesh" },
  { name: "Saharanpur", state: "Uttar Pradesh" },
  { name: "Gorakhpur", state: "Uttar Pradesh" },
  { name: "Noida", state: "Uttar Pradesh" },
  { name: "Faridabad", state: "Uttar Pradesh" },
  { name: "Mathura", state: "Uttar Pradesh" },

  // Madhya Pradesh
  { name: "Bhopal", state: "Madhya Pradesh" },
  { name: "Indore", state: "Madhya Pradesh" },
  { name: "Gwalior", state: "Madhya Pradesh" },
  { name: "Jabalpur", state: "Madhya Pradesh" },
  { name: "Ujjain", state: "Madhya Pradesh" },
  { name: "Sagar", state: "Madhya Pradesh" },
  { name: "Dewas", state: "Madhya Pradesh" },
  { name: "Satna", state: "Madhya Pradesh" },
  { name: "Ratlam", state: "Madhya Pradesh" },
  { name: "Rewa", state: "Madhya Pradesh" },

  // Andhra Pradesh & Telangana
  { name: "Hyderabad", state: "Telangana" },
  { name: "Visakhapatnam", state: "Andhra Pradesh" },
  { name: "Vijayawada", state: "Andhra Pradesh" },
  { name: "Guntur", state: "Andhra Pradesh" },
  { name: "Nellore", state: "Andhra Pradesh" },
  { name: "Kurnool", state: "Andhra Pradesh" },
  { name: "Rajahmundry", state: "Andhra Pradesh" },
  { name: "Tirupati", state: "Andhra Pradesh" },
  { name: "Warangal", state: "Telangana" },
  { name: "Nizamabad", state: "Telangana" },

  // Kerala
  { name: "Thiruvananthapuram", state: "Kerala" },
  { name: "Kochi", state: "Kerala" },
  { name: "Kozhikode", state: "Kerala" },
  { name: "Thrissur", state: "Kerala" },
  { name: "Kollam", state: "Kerala" },
  { name: "Palakkad", state: "Kerala" },
  { name: "Alappuzha", state: "Kerala" },
  { name: "Malappuram", state: "Kerala" },
  { name: "Kannur", state: "Kerala" },
  { name: "Kasaragod", state: "Kerala" },

  // Punjab
  { name: "Chandigarh", state: "Punjab" },
  { name: "Ludhiana", state: "Punjab" },
  { name: "Amritsar", state: "Punjab" },
  { name: "Jalandhar", state: "Punjab" },
  { name: "Patiala", state: "Punjab" },
  { name: "Bathinda", state: "Punjab" },
  { name: "Hoshiarpur", state: "Punjab" },
  { name: "Batala", state: "Punjab" },
  { name: "Pathankot", state: "Punjab" },
  { name: "Moga", state: "Punjab" },

  // Haryana
  { name: "Gurgaon", state: "Haryana" },
  { name: "Faridabad", state: "Haryana" },
  { name: "Panipat", state: "Haryana" },
  { name: "Ambala", state: "Haryana" },
  { name: "Yamunanagar", state: "Haryana" },
  { name: "Rohtak", state: "Haryana" },
  { name: "Hisar", state: "Haryana" },
  { name: "Karnal", state: "Haryana" },
  { name: "Sonipat", state: "Haryana" },
  { name: "Panchkula", state: "Haryana" },

  // Bihar
  { name: "Patna", state: "Bihar" },
  { name: "Gaya", state: "Bihar" },
  { name: "Bhagalpur", state: "Bihar" },
  { name: "Muzaffarpur", state: "Bihar" },
  { name: "Purnia", state: "Bihar" },
  { name: "Darbhanga", state: "Bihar" },
  { name: "Bihar Sharif", state: "Bihar" },
  { name: "Arrah", state: "Bihar" },
  { name: "Begusarai", state: "Bihar" },
  { name: "Katihar", state: "Bihar" },

  // Odisha
  { name: "Bhubaneswar", state: "Odisha" },
  { name: "Cuttack", state: "Odisha" },
  { name: "Rourkela", state: "Odisha" },
  { name: "Berhampur", state: "Odisha" },
  { name: "Sambalpur", state: "Odisha" },
  { name: "Puri", state: "Odisha" },
  { name: "Balasore", state: "Odisha" },
  { name: "Bhadrak", state: "Odisha" },
  { name: "Baripada", state: "Odisha" },

  // Jharkhand
  { name: "Ranchi", state: "Jharkhand" },
  { name: "Jamshedpur", state: "Jharkhand" },
  { name: "Dhanbad", state: "Jharkhand" },
  { name: "Bokaro", state: "Jharkhand" },
  { name: "Deoghar", state: "Jharkhand" },
  { name: "Phusro", state: "Jharkhand" },
  { name: "Hazaribagh", state: "Jharkhand" },
  { name: "Giridih", state: "Jharkhand" },

  // Assam
  { name: "Guwahati", state: "Assam" },
  { name: "Silchar", state: "Assam" },
  { name: "Dibrugarh", state: "Assam" },
  { name: "Jorhat", state: "Assam" },
  { name: "Nagaon", state: "Assam" },
  { name: "Tinsukia", state: "Assam" },
  { name: "Tezpur", state: "Assam" },

  // Chhattisgarh
  { name: "Raipur", state: "Chhattisgarh" },
  { name: "Bhilai", state: "Chhattisgarh" },
  { name: "Bilaspur", state: "Chhattisgarh" },
  { name: "Korba", state: "Chhattisgarh" },
  { name: "Durg", state: "Chhattisgarh" },
  { name: "Rajnandgaon", state: "Chhattisgarh" },

  // Uttarakhand
  { name: "Dehradun", state: "Uttarakhand" },
  { name: "Haridwar", state: "Uttarakhand" },
  { name: "Roorkee", state: "Uttarakhand" },
  { name: "Haldwani", state: "Uttarakhand" },
  { name: "Rudrapur", state: "Uttarakhand" },
  { name: "Kashipur", state: "Uttarakhand" },
  { name: "Rishikesh", state: "Uttarakhand" },

  // Himachal Pradesh
  { name: "Shimla", state: "Himachal Pradesh" },
  { name: "Dharamshala", state: "Himachal Pradesh" },
  { name: "Solan", state: "Himachal Pradesh" },
  { name: "Mandi", state: "Himachal Pradesh" },
  { name: "Palampur", state: "Himachal Pradesh" },
  { name: "Baddi", state: "Himachal Pradesh" },

  // Jammu and Kashmir
  { name: "Srinagar", state: "Jammu and Kashmir" },
  { name: "Jammu", state: "Jammu and Kashmir" },
  { name: "Anantnag", state: "Jammu and Kashmir" },
  { name: "Baramulla", state: "Jammu and Kashmir" },
  { name: "Sopore", state: "Jammu and Kashmir" },
  { name: "Kathua", state: "Jammu and Kashmir" },

  // Goa
  { name: "Panaji", state: "Goa" },
  { name: "Margao", state: "Goa" },
  { name: "Vasco da Gama", state: "Goa" },
  { name: "Mapusa", state: "Goa" },
  { name: "Ponda", state: "Goa" },

  // Tripura
  { name: "Agartala", state: "Tripura" },
  { name: "Dharmanagar", state: "Tripura" },
  { name: "Udaipur", state: "Tripura" },
  { name: "Kailasahar", state: "Tripura" },

  // Manipur
  { name: "Imphal", state: "Manipur" },
  { name: "Thoubal", state: "Manipur" },
  { name: "Bishnupur", state: "Manipur" },

  // Meghalaya
  { name: "Shillong", state: "Meghalaya" },
  { name: "Tura", state: "Meghalaya" },
  { name: "Nongstoin", state: "Meghalaya" },

  // Nagaland
  { name: "Kohima", state: "Nagaland" },
  { name: "Dimapur", state: "Nagaland" },
  { name: "Mokokchung", state: "Nagaland" },

  // Mizoram
  { name: "Aizawl", state: "Mizoram" },
  { name: "Lunglei", state: "Mizoram" },
  { name: "Saiha", state: "Mizoram" },

  // Arunachal Pradesh
  { name: "Itanagar", state: "Arunachal Pradesh" },
  { name: "Naharlagun", state: "Arunachal Pradesh" },
  { name: "Pasighat", state: "Arunachal Pradesh" },

  // Sikkim
  { name: "Gangtok", state: "Sikkim" },
  { name: "Namchi", state: "Sikkim" },
  { name: "Gyalshing", state: "Sikkim" },

  // Union Territories
  { name: "Puducherry", state: "Puducherry" },
  { name: "Port Blair", state: "Andaman and Nicobar Islands" },
  { name: "Kavaratti", state: "Lakshadweep" },
  { name: "Daman", state: "Dadra and Nagar Haveli and Daman and Diu" },
  { name: "Diu", state: "Dadra and Nagar Haveli and Daman and Diu" },
  { name: "Silvassa", state: "Dadra and Nagar Haveli and Daman and Diu" },
  { name: "Leh", state: "Ladakh" },
  { name: "Kargil", state: "Ladakh" },
];

async function main() {
  console.log("Start seeding cities...");
  console.log(`Total cities to process: ${indianCities.length}`);

  // Process cities in batches for better performance
  const batchSize = 10;
  let processedCount = 0;

  for (let i = 0; i < indianCities.length; i += batchSize) {
    const batch = indianCities.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (city) => {
        try {
          await prisma.city.upsert({
            where: { name: city.name },
            update: {},
            create: {
              name: city.name,
              state: city.state,
              isActive: true,
            },
          });
          processedCount++;
          if (processedCount % 20 === 0) {
            console.log(
              `Processed ${processedCount}/${indianCities.length} cities...`
            );
          }
        } catch (error) {
          console.error(`Error processing city ${city.name}:`, error);
        }
      })
    );
  }

  console.log(`✅ Successfully seeded ${processedCount} cities.`);

  // Verify the count in database
  const totalCities = await prisma.city.count();
  console.log(`📊 Total cities in database: ${totalCities}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
