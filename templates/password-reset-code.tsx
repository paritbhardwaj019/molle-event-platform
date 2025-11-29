import React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
} from "@react-email/components";

interface PasswordResetCodeEmailProps {
  userName: string;
  resetCode: string;
}

export default function PasswordResetCodeEmail({
  userName,
  resetCode,
}: PasswordResetCodeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>🔐 Password Reset Request</Heading>
            <Text style={paragraph}>Hi {userName},</Text>
            <Text style={paragraph}>
              We received a request to reset your password for your Molle
              account.
            </Text>
            <Text style={paragraph}>
              Use the following verification code to reset your password:
            </Text>
            <Section style={codeContainer}>
              <Text style={code}>{resetCode}</Text>
            </Section>
            <Text style={paragraph}>
              This code will expire in <strong>15 minutes</strong>.
            </Text>
            <Text style={paragraph}>
              If you didn't request a password reset, you can safely ignore this
              email.
            </Text>
            <Hr style={hr} />
            <Text style={footer}>
              This is an automated message from Molle. Please do not reply to
              this email.
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
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const box = {
  padding: "0 48px",
};

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  marginTop: "48px",
  marginBottom: "24px",
  color: "#1a1a1a",
  textAlign: "center" as const,
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#525252",
  marginBottom: "16px",
};

const codeContainer = {
  background: "#f4f4f5",
  borderRadius: "8px",
  padding: "24px",
  margin: "32px 0",
  textAlign: "center" as const,
  border: "2px dashed #e4e4e7",
};

const code = {
  fontSize: "36px",
  fontWeight: "bold",
  letterSpacing: "8px",
  color: "#18181b",
  fontFamily: "monospace",
  margin: "0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "32px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  marginTop: "32px",
};
