# Email Templates

This directory contains React Email templates for sending ticket confirmation emails to users and hosts.

## Templates

### 1. User Ticket Confirmation (`user-ticket-confirmation.tsx`)

This template is sent to users when they successfully purchase tickets for an event.

**Features:**

- Event details (title, date, time, location)
- Ticket information (ticket numbers, holder details, package names)
- Download link for tickets
- Important information and instructions
- Professional design with event branding

**Props:**

- `userName`: Name of the ticket buyer
- `eventTitle`: Title of the event
- `eventDate`: Formatted event date
- `eventTime`: Formatted event time
- `eventLocation`: Event location
- `bookingNumber`: Unique booking reference
- `totalAmount`: Total amount paid
- `tickets`: Array of ticket details
- `downloadUrl`: Link to download tickets
- `eventImage`: Optional event cover image

### 2. Host Booking Notification (`host-booking-notification.tsx`)

This template is sent to event hosts when they receive a new booking.

**Features:**

- Booking summary with earnings breakdown
- Buyer information
- Ticket details for all purchased tickets
- Earnings calculation and distribution
- Next steps and action items
- Professional design with financial focus

**Props:**

- `hostName`: Name of the event host
- `eventTitle`: Title of the event
- `eventDate`: Formatted event date
- `eventTime`: Formatted event time
- `eventLocation`: Event location
- `bookingNumber`: Unique booking reference
- `totalAmount`: Total booking value
- `hostEarnings`: Amount the host will receive
- `tickets`: Array of ticket details
- `buyerName`: Name of the ticket buyer
- `buyerEmail`: Email of the ticket buyer
- `buyerPhone`: Phone number of the ticket buyer
- `eventImage`: Optional event cover image

## Usage

### Sending Emails

Use the `sendTicketConfirmationEmails` function from `@/lib/email`:

```typescript
import { sendTicketConfirmationEmails } from "@/lib/email";

const emailData = {
  userName: "John Doe",
  userEmail: "john@example.com",
  hostName: "Jane Smith",
  hostEmail: "jane@example.com",
  eventTitle: "Summer Music Festival",
  eventDate: "Saturday, July 15, 2024",
  eventTime: "7:00 PM",
  eventLocation: "Central Park, New York",
  eventImage: "https://example.com/event-image.jpg",
  bookingNumber: "BK123456789",
  totalAmount: "1500.00",
  hostEarnings: "1275.00",
  tickets: [
    {
      ticketNumber: "TK001",
      fullName: "John Doe",
      age: 25,
      phoneNumber: "+1234567890",
      packageName: "VIP Package",
      ticketPrice: "1500.00",
    },
  ],
  downloadUrl: "https://yourapp.com/tickets/BK123456789",
};

const result = await sendTicketConfirmationEmails(emailData);
```

### Environment Variables

Make sure you have the following environment variables set:

```env
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_URL=https://yourapp.com
```

### Testing

You can test the email functionality using the test endpoint:

```bash
curl -X POST http://localhost:3000/api/test-email
```

## Styling

The templates use inline styles for maximum email client compatibility. The design is responsive and follows modern email design best practices.

## Customization

To customize the templates:

1. Modify the React components in the template files
2. Update the styles object at the bottom of each file
3. Test with different email clients
4. Update the email service if needed

## Dependencies

- `@react-email/components`: React Email components
- `resend`: Email delivery service
- `@react-email/render`: HTML rendering for emails

## Notes

- All images should be hosted on a CDN for reliable delivery
- Test emails thoroughly across different email clients
- Monitor email delivery rates and engagement
- Consider adding tracking pixels for analytics
