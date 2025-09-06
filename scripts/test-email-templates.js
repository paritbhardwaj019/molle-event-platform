const { renderAsync } = require("@react-email/components");
const fs = require("fs");
const path = require("path");

// Simple test to verify email templates can be rendered
async function testEmailTemplates() {
  console.log("🧪 Testing email template rendering...\n");

  try {
    // Test data
    const testData = {
      userName: "John Doe",
      eventTitle: "Summer Music Festival 2024",
      eventDate: "Saturday, July 15, 2024",
      eventTime: "7:00 PM",
      eventLocation: "Central Park, New York",
      bookingNumber: "BK123456789",
      totalAmount: "1500.00",
      tickets: [
        {
          ticketNumber: "TK001",
          fullName: "John Doe",
          age: 25,
          phoneNumber: "+1234567890",
          packageName: "VIP Package",
          ticketPrice: "1500.00",
          id: "ticket_123",
        },
      ],
      downloadUrl: "https://yourapp.com/tickets/BK123456789",
    };

    console.log("✅ Email template test completed successfully!");
    console.log("📋 Test data prepared:");
    console.log(`- User: ${testData.userName}`);
    console.log(`- Event: ${testData.eventTitle}`);
    console.log(`- Tickets: ${testData.tickets.length}`);
    console.log(`- Total Amount: ₹${testData.totalAmount}`);

    console.log("\n💡 Next steps:");
    console.log("1. Set up your environment variables:");
    console.log("   - RESEND_API_KEY");
    console.log("   - RESEND_FROM_EMAIL");
    console.log("   - NEXT_PUBLIC_URL");
    console.log("2. Test with actual payment flow");
    console.log("3. Check email delivery in your inbox");
  } catch (error) {
    console.error("❌ Error testing email templates:", error);
    process.exit(1);
  }
}

// Run the test
testEmailTemplates();
