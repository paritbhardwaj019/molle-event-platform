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

interface UserTicketConfirmationEmailProps {
  userName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  bookingNumber: string;
  totalAmount: string;
  tickets: Array<{
    ticketNumber: string;
    fullName: string;
    age: number;
    phoneNumber: string;
    packageName: string;
    ticketPrice: string;
    id: string;
  }>;
  downloadUrl: string;
}

export const UserTicketConfirmationEmail: React.FC<
  UserTicketConfirmationEmailProps
> = ({
  userName,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  bookingNumber,
  totalAmount,
  tickets,
  downloadUrl,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Your tickets for {eventTitle} are ready! 🎉</Preview>
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
            <Heading style={h1}>🎉 Booking Confirmed!</Heading>

            <Text style={greeting}>Hi {userName},</Text>

            <Text style={paragraph}>
              Your booking has been successfully confirmed! We're excited to see
              you at the event.
            </Text>

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
                  <Text style={detailLabel}>🔢 Booking #</Text>
                  <Text style={detailValue}>{bookingNumber}</Text>
                </Column>
              </Row>
            </Section>

            {/* Ticket Details */}
            <Section style={ticketSection}>
              <Heading style={h2}>Your Tickets</Heading>
              <Text style={paragraph}>
                You have purchased {tickets.length} ticket
                {tickets.length > 1 ? "s" : ""} for a total of ₹{totalAmount}
              </Text>

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

            {/* Download Section */}
            <Section style={downloadSection}>
              <Heading style={h2}>📱 Download Your Tickets</Heading>
              <Text style={paragraph}>
                Your tickets are ready for download. Each ticket contains a
                unique QR code that will be scanned at the event entrance.
              </Text>

              {tickets.map((ticket, index) => (
                <Link
                  key={ticket.id}
                  href={`${process.env.NEXT_PUBLIC_URL}/tickets/${ticket.id}`}
                  style={downloadButton}
                >
                  Download Ticket #{ticket.ticketNumber}
                </Link>
              ))}

              <Text style={note}>
                💡 <strong>Pro tip:</strong> Save your tickets to your phone's
                wallet or take a screenshot for easy access at the event.
              </Text>
            </Section>

            <Hr style={hr} />

            {/* Important Notes */}
            <Section style={notesSection}>
              <Heading style={h3}>Important Information</Heading>
              <ul style={notesList}>
                <li style={noteItem}>
                  <strong>Entry:</strong> Please arrive 15 minutes before the
                  event starts
                </li>
                <li style={noteItem}>
                  <strong>ID Required:</strong> Bring a valid government ID for
                  verification
                </li>
                <li style={noteItem}>
                  <strong>QR Code:</strong> Each ticket has a unique QR code -
                  don't share it with others
                </li>
                <li style={noteItem}>
                  <strong>Contact:</strong> If you have any questions, contact
                  the event host through the app
                </li>
              </ul>
            </Section>

            {/* Footer */}
            <Section style={footer}>
              <Text style={footerText}>
                Thank you for choosing Molle Events! We hope you have an amazing
                time.
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

const h3 = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "24px 0 12px",
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

const downloadSection = {
  backgroundColor: "#f0f9ff",
  padding: "24px",
  borderRadius: "8px",
  margin: "32px 0",
  textAlign: "center" as const,
};

const downloadButton = {
  backgroundColor: "#6366f1",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  margin: "16px 0",
};

const note = {
  color: "#6b7280",
  fontSize: "12px",
  fontStyle: "italic",
  margin: "16px 0 0",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const notesSection = {
  margin: "24px 0",
};

const notesList = {
  margin: "16px 0",
  padding: "0",
};

const noteItem = {
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

export default UserTicketConfirmationEmail;
