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

interface HostKycApprovalEmailProps {
  hostName: string;
}

export default function HostKycApprovalEmail({
  hostName,
}: HostKycApprovalEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Host KYC verification has been approved!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
            width="120"
            height="40"
            alt="Molle Events"
            style={logo}
          />
          <Heading style={heading}>KYC Verification Approved!</Heading>
          <Section style={section}>
            <Text style={text}>Hello {hostName},</Text>
            <Text style={text}>
              Great news! Your KYC (Know Your Customer) verification has been
              approved. You are now fully verified on our platform and can host
              events.
            </Text>
            <Text style={text}>With your verified status, you can now:</Text>
            <Text style={listItem}>• Create and publish events</Text>
            <Text style={listItem}>• Receive payments for your events</Text>
            <Text style={listItem}>• Access all host features</Text>
            <Text style={text}>
              Visit your dashboard to start creating amazing events!
            </Text>
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
              style={button}
            >
              Go to Dashboard
            </Link>
            <Text style={text}>
              Thank you for being a part of our community. We look forward to
              seeing the incredible events you'll create!
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
