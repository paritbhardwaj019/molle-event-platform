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

interface PayoutRejectedEmailProps {
  userName: string;
  amount: string;
}

export default function PayoutRejectedEmail({
  userName,
  amount,
}: PayoutRejectedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your withdrawal request for ₹{amount} was not processed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
            width="120"
            height="40"
            alt="Molle Events"
            style={logo}
          />
          <Heading style={heading}>Withdrawal Request Not Processed</Heading>
          <Section style={section}>
            <Text style={text}>Hello {userName},</Text>
            <Text style={text}>
              We regret to inform you that your withdrawal request for{" "}
              <strong>₹{amount}</strong> could not be processed at this time.
            </Text>
            <Text style={text}>
              This could be due to one of the following reasons:
            </Text>
            <Text style={listItem}>• Insufficient funds in your wallet</Text>
            <Text style={listItem}>• Incorrect bank account details</Text>
            <Text style={listItem}>
              • Technical issues with the payment gateway
            </Text>
            <Text style={listItem}>• Verification requirements not met</Text>

            <Text style={text}>
              Your funds remain secure in your wallet balance. You can submit a
              new withdrawal request after addressing any issues.
            </Text>

            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payouts`}
              style={button}
            >
              Request New Withdrawal
            </Link>

            <Text style={text}>
              If you need further assistance, please contact our support team.
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
