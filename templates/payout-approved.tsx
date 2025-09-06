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

interface PayoutApprovedEmailProps {
  userName: string;
  amount: string;
  accountNumber?: string;
  bankName?: string;
}

export default function PayoutApprovedEmail({
  userName,
  amount,
  accountNumber,
  bankName,
}: PayoutApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your withdrawal request for ₹{amount} has been approved!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
            width="120"
            height="40"
            alt="Molle Events"
            style={logo}
          />
          <Heading style={heading}>Withdrawal Request Approved!</Heading>
          <Section style={section}>
            <Text style={text}>Hello {userName},</Text>
            <Text style={text}>
              Great news! Your withdrawal request for <strong>₹{amount}</strong>{" "}
              has been approved and processed.
            </Text>
            <Text style={text}>
              The funds have been transferred to your bank account
              {accountNumber ? ` ending with *${accountNumber.slice(-4)}` : ""}
              {bankName ? ` at ${bankName}` : ""}.
            </Text>
            <Text style={text}>Details of your transaction:</Text>
            <Text style={listItem}>• Amount: ₹{amount}</Text>
            <Text style={listItem}>• Status: Completed</Text>
            <Text style={listItem}>
              • Processing Date: {new Date().toLocaleDateString()}
            </Text>

            <Text style={text}>
              The funds should reflect in your account within 1-3 business days,
              depending on your bank's processing time.
            </Text>

            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payouts`}
              style={button}
            >
              View Payout History
            </Link>

            <Text style={text}>
              Thank you for being a valued member of our platform!
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
