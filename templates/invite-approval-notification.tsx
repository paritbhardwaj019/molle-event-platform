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

interface InviteApprovalNotificationEmailProps {
  userName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  hostName: string;
  eventSlug: string;
}

export const InviteApprovalNotificationEmail: React.FC<
  InviteApprovalNotificationEmailProps
> = ({
  userName,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  hostName,
  eventSlug,
}) => {
  const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL}/events/${eventSlug}`;

  return (
    <Html>
      <Head />
      <Preview>
        🎉 Your invite request for {eventTitle} has been approved!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
              width="120"
              height="40"
              alt="Molle Events"
              style={logo}
            />
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>🎉 Invite Request Approved!</Heading>

            <Text style={text}>Hi {userName},</Text>

            <Text style={text}>
              Great news! Your invite request for <strong>{eventTitle}</strong>{" "}
              has been approved by {hostName}.
            </Text>

            <Text style={text}>
              You can now view the event details and book your tickets if
              needed.
            </Text>

            {/* Event Details Card */}
            <Section style={eventCard}>
              <Heading style={eventTitle}>{eventTitle}</Heading>

              <Row style={eventDetails}>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>📅 Date & Time</Text>
                  <Text style={detailValue}>
                    {eventDate} at {eventTime}
                  </Text>
                </Column>
              </Row>

              <Row style={eventDetails}>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>📍 Location</Text>
                  <Text style={detailValue}>{eventLocation}</Text>
                </Column>
              </Row>

              <Row style={eventDetails}>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>👤 Host</Text>
                  <Text style={detailValue}>{hostName}</Text>
                </Column>
              </Row>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Link href={eventUrl} style={button}>
                View Event Details
              </Link>
            </Section>

            <Text style={text}>
              You can now access all event information, connect with other
              attendees, and make your booking if this is a paid event.
            </Text>

            <Hr style={hr} />

            <Text style={footerText}>
              Thank you for using Molle Events! If you have any questions, feel
              free to reach out to our support team.
            </Text>

            <Text style={footerText}>
              Best regards,
              <br />
              The Molle Events Team
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © 2024 Molle Events. All rights reserved.
            </Text>
            <Text style={footerText}>
              Visit us at{" "}
              <Link href={process.env.NEXT_PUBLIC_APP_URL} style={link}>
                {process.env.NEXT_PUBLIC_APP_URL}
              </Link>
            </Text>
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
  maxWidth: "600px",
};

const header = {
  padding: "32px 20px",
  backgroundColor: "#1f2937",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
};

const content = {
  padding: "20px 40px",
};

const h1 = {
  color: "#1f2937",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "40px 0 20px",
  textAlign: "center" as const,
};

const text = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const eventCard = {
  backgroundColor: "#f8fafc",
  border: "2px solid #e5e7eb",
  borderRadius: "12px",
  padding: "24px",
  margin: "32px 0",
};

const eventTitle = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 20px 0",
  textAlign: "center" as const,
};

const eventDetails = {
  marginBottom: "16px",
};

const detailColumn = {
  width: "100%",
};

const detailLabel = {
  color: "#6b7280",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 4px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const detailValue = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "500",
  margin: "0 0 16px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#3b82f6",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
  margin: "0 auto",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const footer = {
  padding: "20px 40px",
  backgroundColor: "#f9fafb",
  borderTop: "1px solid #e5e7eb",
  textAlign: "center" as const,
};

const footerText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
  textAlign: "center" as const,
};

const link = {
  color: "#3b82f6",
  textDecoration: "underline",
};

export default InviteApprovalNotificationEmail;
