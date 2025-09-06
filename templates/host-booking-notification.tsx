import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";

interface HostBookingNotificationEmailProps {
  hostName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  bookingNumber: string;
  totalAmount: string;
  hostEarnings: string;
  tickets: Array<{
    ticketNumber: string;
    fullName: string;
    age: number;
    phoneNumber: string;
    packageName: string;
    ticketPrice: string;
  }>;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
}

export const HostBookingNotificationEmail: React.FC<
  HostBookingNotificationEmailProps
> = ({
  hostName,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  bookingNumber,
  totalAmount,
  hostEarnings,
  tickets,
  buyerName,
  buyerEmail,
  buyerPhone,
}) => {
  return (
    <Html>
      <Head />
      <Preview>
        New booking for {eventTitle} - ₹{totalAmount} earned! 🎉
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <div style={headerContent}>
              <Heading style={headerTitle}>{eventTitle}</Heading>
            </div>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>🎉 New Booking Received!</Heading>

            <Text style={greeting}>Hi {hostName},</Text>

            <Text style={paragraph}>
              Great news! You've received a new booking for your event. Here are
              the details:
            </Text>

            {/* Booking Summary */}
            <Section style={summarySection}>
              <Row>
                <Column style={summaryColumn}>
                  <Text style={summaryLabel}>Total Booking Value</Text>
                  <Text style={summaryValue}>₹{totalAmount}</Text>
                </Column>
                <Column style={summaryColumn}>
                  <Text style={summaryLabel}>Your Earnings</Text>
                  <Text style={earningsValue}>₹{hostEarnings}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={summaryColumn}>
                  <Text style={summaryLabel}>Tickets Sold</Text>
                  <Text style={summaryValue}>{tickets.length}</Text>
                </Column>
                <Column style={summaryColumn}>
                  <Text style={summaryLabel}>Booking #</Text>
                  <Text style={summaryValue}>{bookingNumber}</Text>
                </Column>
              </Row>
            </Section>

            {/* Event Details */}
            <Section style={eventDetails}>
              <Heading style={h2}>Event Details</Heading>
              <Row>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>📅 Date</Text>
                  <Text style={detailValue}>{eventDate}</Text>
                </Column>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>🕒 Time</Text>
                  <Text style={detailValue}>{eventTime}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>📍 Location</Text>
                  <Text style={detailValue}>{eventLocation}</Text>
                </Column>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>📊 Status</Text>
                  <Text style={detailValue}>Confirmed</Text>
                </Column>
              </Row>
            </Section>

            {/* Buyer Information */}
            <Section style={buyerSection}>
              <Heading style={h2}>Buyer Information</Heading>
              <Row>
                <Column style={buyerColumn}>
                  <Text style={buyerLabel}>Name</Text>
                  <Text style={buyerValue}>{buyerName}</Text>
                </Column>
                <Column style={buyerColumn}>
                  <Text style={buyerLabel}>Email</Text>
                  <Text style={buyerValue}>
                    <Link href={`mailto:${buyerEmail}`} style={buyerLink}>
                      {buyerEmail}
                    </Link>
                  </Text>
                </Column>
              </Row>
              <Row>
                <Column style={buyerColumn}>
                  <Text style={buyerLabel}>Phone</Text>
                  <Text style={buyerValue}>
                    <Link href={`tel:${buyerPhone}`} style={buyerLink}>
                      {buyerPhone}
                    </Link>
                  </Text>
                </Column>
                <Column style={buyerColumn}>
                  <Text style={buyerLabel}>Booking Time</Text>
                  <Text style={buyerValue}>{new Date().toLocaleString()}</Text>
                </Column>
              </Row>
            </Section>

            {/* Ticket Details */}
            <Section style={ticketSection}>
              <Heading style={h2}>Ticket Details</Heading>

              {tickets.map((ticket, index) => (
                <Section key={index} style={ticketCard}>
                  <Row>
                    <Column style={ticketInfo}>
                      <Text style={ticketNumber}>
                        Ticket #{ticket.ticketNumber}
                      </Text>
                      <Text style={ticketName}>{ticket.fullName}</Text>
                      <Text style={ticketDetails}>
                        Age: {ticket.age} • Phone: {ticket.phoneNumber}
                      </Text>
                      <Text style={ticketPackage}>{ticket.packageName}</Text>
                    </Column>
                    <Column style={ticketPrice}>
                      <Text style={priceText}>₹{ticket.ticketPrice}</Text>
                    </Column>
                  </Row>
                </Section>
              ))}
            </Section>

            <Hr style={hr} />

            {/* Earnings Breakdown */}
            <Section style={earningsSection}>
              <Heading style={h2}>💰 Earnings Breakdown</Heading>
              <Text style={paragraph}>
                Here's how the payment is distributed:
              </Text>

              <Section style={breakdownCard}>
                <Row>
                  <Column style={breakdownColumn}>
                    <Text style={breakdownLabel}>Total Amount</Text>
                    <Text style={breakdownValue}>₹{totalAmount}</Text>
                  </Column>
                  <Column style={breakdownColumn}>
                    <Text style={breakdownLabel}>Platform Fee</Text>
                    <Text style={breakdownValue}>
                      ₹{(parseFloat(totalAmount) * 0.05).toFixed(2)}
                    </Text>
                  </Column>
                </Row>
                <Row>
                  <Column style={breakdownColumn}>
                    <Text style={breakdownLabel}>Taxes (GST)</Text>
                    <Text style={breakdownValue}>
                      ₹{(parseFloat(totalAmount) * 0.18).toFixed(2)}
                    </Text>
                  </Column>
                  <Column style={breakdownColumn}>
                    <Text style={breakdownLabel}>Your Earnings</Text>
                    <Text style={earningsHighlight}>₹{hostEarnings}</Text>
                  </Column>
                </Row>
              </Section>

              <Text style={note}>
                💡 <strong>Note:</strong> Your earnings will be credited to your
                wallet within 24-48 hours after the event.
              </Text>
            </Section>

            {/* Action Items */}
            <Section style={actionSection}>
              <Heading style={h2}>📋 Next Steps</Heading>
              <ul style={actionList}>
                <li style={actionItem}>
                  <strong>Prepare for the event:</strong> Make sure you have all
                  necessary arrangements ready
                </li>
                <li style={actionItem}>
                  <strong>Contact the buyer:</strong> You can message them
                  through the app if needed
                </li>
                <li style={actionItem}>
                  <strong>Check-in system:</strong> Use the QR code scanner in
                  your host dashboard for ticket verification
                </li>
                <li style={actionItem}>
                  <strong>Support:</strong> If you need any assistance, contact
                  our support team
                </li>
              </ul>
            </Section>

            {/* Footer */}
            <Section style={footer}>
              <Text style={footerText}>
                Thank you for hosting with Molle Events! We're here to support
                your success.
              </Text>
              <Text style={footerText}>
                Need help? Contact us at{" "}
                <Link href="mailto:support@molleapp.com" style={footerLink}>
                  support@molleapp.com
                </Link>
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const header = {
  backgroundColor: "#6366f1",
  padding: "32px 24px",
  borderRadius: "8px",
  marginBottom: "32px",
  textAlign: "center" as const,
};

const headerContent = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const headerTitle = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0",
  textAlign: "center" as const,
};

const content = {
  padding: "0 48px",
};

const h1 = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0 20px",
  textAlign: "center" as const,
};

const h2 = {
  color: "#1f2937",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "32px 0 16px",
};

const greeting = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const paragraph = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "16px 0",
};

const summarySection = {
  backgroundColor: "#f0f9ff",
  padding: "24px",
  borderRadius: "8px",
  margin: "24px 0",
};

const summaryColumn = {
  width: "50%",
  padding: "8px 0",
};

const summaryLabel = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "bold",
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
};

const summaryValue = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0",
};

const earningsValue = {
  color: "#059669",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0",
};

const eventDetails = {
  backgroundColor: "#f8fafc",
  padding: "24px",
  borderRadius: "8px",
  margin: "24px 0",
};

const detailColumn = {
  width: "50%",
  padding: "8px 0",
};

const detailLabel = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "bold",
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
};

const detailValue = {
  color: "#1f2937",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0",
};

const buyerSection = {
  backgroundColor: "#fef3c7",
  padding: "24px",
  borderRadius: "8px",
  margin: "24px 0",
};

const buyerColumn = {
  width: "50%",
  padding: "8px 0",
};

const buyerLabel = {
  color: "#92400e",
  fontSize: "12px",
  fontWeight: "bold",
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
};

const buyerValue = {
  color: "#1f2937",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0",
};

const buyerLink = {
  color: "#6366f1",
  textDecoration: "none",
};

const ticketSection = {
  margin: "32px 0",
};

const ticketCard = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px",
  margin: "12px 0",
};

const ticketInfo = {
  width: "70%",
};

const ticketPrice = {
  width: "30%",
  textAlign: "right" as const,
};

const ticketNumber = {
  color: "#6366f1",
  fontSize: "12px",
  fontWeight: "bold",
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
};

const ticketName = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0 0 4px",
};

const ticketDetails = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "0 0 4px",
};

const ticketPackage = {
  color: "#059669",
  fontSize: "12px",
  fontWeight: "bold",
  margin: "0",
};

const priceText = {
  color: "#059669",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const earningsSection = {
  margin: "24px 0",
};

const breakdownCard = {
  backgroundColor: "#f0fdf4",
  padding: "24px",
  borderRadius: "8px",
  margin: "16px 0",
};

const breakdownColumn = {
  width: "50%",
  padding: "8px 0",
};

const breakdownLabel = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "bold",
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
};

const breakdownValue = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0",
};

const earningsHighlight = {
  color: "#059669",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0",
};

const note = {
  color: "#6b7280",
  fontSize: "12px",
  fontStyle: "italic",
  margin: "16px 0 0",
};

const actionSection = {
  margin: "24px 0",
};

const actionList = {
  margin: "16px 0",
  padding: "0",
};

const actionItem = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
  paddingLeft: "0",
};

const footer = {
  marginTop: "32px",
  paddingTop: "24px",
  borderTop: "1px solid #e5e7eb",
  textAlign: "center" as const,
};

const footerText = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "8px 0",
};

const footerLink = {
  color: "#6366f1",
  textDecoration: "none",
};

export default HostBookingNotificationEmail;
