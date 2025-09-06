import React from "react";
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
} from "@react-email/components";

interface PayoutRequestedEmailProps {
  userName: string;
  amount: string;
  requestId: string;
}

export default function PayoutRequestedEmail({
  userName,
  amount,
  requestId,
}: PayoutRequestedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your withdrawal request for ₹{amount} has been received</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
            width="120"
            height="40"
            alt="Molle Events"
            style={logo}
          />
          <Heading style={heading}>Withdrawal Request Received</Heading>
          <Section style={section}>
            <Text style={text}>Hello {userName},</Text>
            <Text style={text}>
              We have received your withdrawal request for{" "}
              <strong>₹{amount}</strong>.
            </Text>
            <Text style={text}>
              Your request is now being processed. Here are the details:
            </Text>
            <Text style={listItem}>• Request ID: {requestId}</Text>
            <Text style={listItem}>• Amount: ₹{amount}</Text>
            <Text style={listItem}>• Status: Pending</Text>
            <Text style={listItem}>
              • Request Date: {new Date().toLocaleDateString()}
            </Text>

            <Text style={text}>
              Most withdrawal requests are processed within 1-3 business days.
              We'll notify you once your request has been approved.
            </Text>

            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payouts`}
              style={button}
            >
              Track Your Request
            </Link>

            <Text style={text}>
              If you have any questions about your withdrawal, please contact
              our support team.
            </Text>
            <Text style={text}>
              Best regards,
              <br />
              The Molle Events Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px",
  maxWidth: "600px",
};

const logo = {
  margin: "0 auto",
  marginBottom: "20px",
};

const heading = {
  fontSize: "24px",
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  fontWeight: "400",
  color: "#484848",
  textAlign: "center" as const,
};

const section = {
  padding: "20px",
};

const text = {
  fontSize: "16px",
  lineHeight: "1.4",
  color: "#3c4043",
  marginBottom: "16px",
};

const listItem = {
  fontSize: "16px",
  lineHeight: "1.4",
  color: "#3c4043",
  marginBottom: "8px",
  marginLeft: "25px",
};

const button = {
  backgroundColor: "#5e6ad2",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px",
  marginTop: "25px",
  marginBottom: "25px",
};
