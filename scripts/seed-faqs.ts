import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleFAQs = [
  {
    question: "How do I create an event on the platform?",
    answer:
      "To create an event, first complete your KYC verification as a host. Once approved, navigate to your dashboard and click 'Create Event'. Fill in all the required details including event title, description, date, venue, and pricing information. After review, your event will be published on the platform.",
    order: 1,
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express), debit cards, and digital wallets like PayPal and Apple Pay. All payments are processed securely through our payment gateway with bank-level encryption.",
    order: 2,
  },
  {
    question: "Can I cancel my event ticket?",
    answer:
      "Ticket cancellation policies vary by event and are set by the event host. Generally, tickets can be cancelled up to 24-48 hours before the event start time. Please check the specific event's cancellation policy on the event page or contact the host directly for more information.",
    order: 3,
  },
  {
    question: "How do I become a referrer and earn commissions?",
    answer:
      "To become a referrer, sign up for a referrer account and get approved by our team. Once approved, you can generate referral links for events and earn commissions when people book tickets through your links. Commission rates vary by event and are clearly displayed in your dashboard.",
    order: 4,
  },
  {
    question: "What is KYC verification and why is it required?",
    answer:
      "KYC (Know Your Customer) verification is required for all event hosts to ensure platform safety and comply with regulations. You'll need to provide identity documents, bank details, and venue information. This process helps maintain trust and security for all users on our platform.",
    order: 5,
  },
  {
    question: "How do I contact event hosts?",
    answer:
      "You can contact event hosts through our built-in messaging system. Visit the event page and click 'Message Host' to start a conversation. This ensures all communication is tracked and both parties are protected.",
    order: 6,
  },
  {
    question: "What happens if an event is cancelled?",
    answer:
      "If an event is cancelled by the host, all ticket holders will be automatically refunded to their original payment method within 5-7 business days. You'll receive an email notification about the cancellation and refund status. In case of weather-related cancellations, the host's cancellation policy will apply.",
    order: 7,
  },
  {
    question: "How do I download my event tickets?",
    answer:
      "After successful booking, you can download your tickets from your account dashboard under 'My Bookings'. Tickets are also emailed to you immediately after purchase. Each ticket contains a unique QR code for entry verification at the event.",
    order: 8,
  },
];

async function seedFAQs() {
  try {
    console.log("🌱 Seeding FAQs...");

    // Clear existing FAQs
    await prisma.fAQ.deleteMany();
    console.log("Cleared existing FAQs");

    // Create new FAQs
    for (const faq of sampleFAQs) {
      await prisma.fAQ.create({
        data: faq,
      });
      console.log(`Created FAQ: ${faq.question.substring(0, 50)}...`);
    }

    console.log(`✅ Successfully seeded ${sampleFAQs.length} FAQs`);
  } catch (error) {
    console.error("❌ Error seeding FAQs:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedFAQs().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seedFAQs };
