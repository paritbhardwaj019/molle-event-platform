import React from "react";
import { Resend } from "resend";
import { renderAsync } from "@react-email/components";
import UserTicketConfirmationEmail from "@/templates/user-ticket-confirmation";
import HostBookingNotificationEmail from "@/templates/host-booking-notification";
import InviteApprovalNotificationEmail from "@/templates/invite-approval-notification";
import HostKycApprovalEmail from "@/templates/host-kyc-approval";
import DatingKycApprovalEmail from "@/templates/dating-kyc-approval";
import PayoutRequestedEmail from "@/templates/payout-requested";
import PayoutApprovedEmail from "@/templates/payout-approved";
import PayoutRejectedEmail from "@/templates/payout-rejected";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface TicketData {
  ticketNumber: string;
  fullName: string;
  age: number;
  phoneNumber: string;
  packageName: string;
  ticketPrice: string;
  id: string;
}

export interface EmailData {
  // User email data
  userName: string;
  userEmail: string;

  // Host email data
  hostName: string;
  hostEmail: string;

  // Event data
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;

  bookingNumber: string;
  totalAmount: string;
  hostEarnings: string;

  tickets: TicketData[];

  downloadUrl: string;
}

export interface InviteApprovalEmailData {
  userName: string;
  userEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  hostName: string;
  eventSlug: string;
}

export async function sendTicketConfirmationEmails(emailData: EmailData) {
  try {
    const userEmailHtml = await renderAsync(
      <UserTicketConfirmationEmail
        userName={emailData.userName}
        eventTitle={emailData.eventTitle}
        eventDate={emailData.eventDate}
        eventTime={emailData.eventTime}
        eventLocation={emailData.eventLocation}
        bookingNumber={emailData.bookingNumber}
        totalAmount={emailData.totalAmount}
        tickets={emailData.tickets}
        downloadUrl={emailData.downloadUrl}
      />
    );

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: emailData.userEmail,
      subject: `🎉 Your tickets for ${emailData.eventTitle} are ready!`,
      html: userEmailHtml,
    });

    // Send email to host
    const hostEmailHtml = await renderAsync(
      <HostBookingNotificationEmail
        hostName={emailData.hostName}
        eventTitle={emailData.eventTitle}
        eventDate={emailData.eventDate}
        eventTime={emailData.eventTime}
        eventLocation={emailData.eventLocation}
        bookingNumber={emailData.bookingNumber}
        totalAmount={emailData.totalAmount}
        hostEarnings={emailData.hostEarnings}
        tickets={emailData.tickets}
        buyerName={emailData.userName}
        buyerEmail={emailData.userEmail}
        buyerPhone={emailData.tickets[0]?.phoneNumber || "Not provided"}
      />
    );

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: emailData.hostEmail,
      subject: `🎉 New booking for ${emailData.eventTitle} - ₹${emailData.totalAmount} earned!`,
      html: hostEmailHtml,
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Error sending ticket confirmation emails:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendInviteApprovalEmail(
  emailData: InviteApprovalEmailData
) {
  try {
    const emailHtml = await renderAsync(
      <InviteApprovalNotificationEmail
        userName={emailData.userName}
        eventTitle={emailData.eventTitle}
        eventDate={emailData.eventDate}
        eventTime={emailData.eventTime}
        eventLocation={emailData.eventLocation}
        hostName={emailData.hostName}
        eventSlug={emailData.eventSlug}
      />
    );

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: emailData.userEmail,
      subject: `🎉 Your invite request for ${emailData.eventTitle} has been approved!`,
      html: emailHtml,
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Error sending invite approval email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendHostKycApprovalEmail(
  hostName: string,
  hostEmail: string
) {
  try {
    const emailHtml = await renderAsync(
      <HostKycApprovalEmail hostName={hostName} />
    );

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: hostEmail,
      subject: "🎉 Your Host KYC Verification is Approved!",
      html: emailHtml,
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Error sending host KYC approval email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendDatingKycApprovalEmail(
  userName: string,
  userEmail: string
) {
  try {
    const emailHtml = await renderAsync(
      <DatingKycApprovalEmail userName={userName} />
    );

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: userEmail,
      subject: "🎉 Your Dating Profile is Now Verified!",
      html: emailHtml,
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Error sending dating KYC approval email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendPayoutRequestedEmail(
  userName: string,
  userEmail: string,
  amount: string,
  requestId: string
) {
  try {
    const emailHtml = await renderAsync(
      <PayoutRequestedEmail
        userName={userName}
        amount={amount}
        requestId={requestId}
      />
    );

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: userEmail,
      subject: `🧾 Your Withdrawal Request for ₹${amount} Has Been Received`,
      html: emailHtml,
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Error sending payout requested email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendPayoutApprovedEmail(
  userName: string,
  userEmail: string,
  amount: string,
  accountNumber?: string,
  bankName?: string
) {
  try {
    const emailHtml = await renderAsync(
      <PayoutApprovedEmail
        userName={userName}
        amount={amount}
        accountNumber={accountNumber}
        bankName={bankName}
      />
    );

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: userEmail,
      subject: `💰 Your Withdrawal Request for ₹${amount} Has Been Approved`,
      html: emailHtml,
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Error sending payout approved email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendPayoutRejectedEmail(
  userName: string,
  userEmail: string,
  amount: string
) {
  try {
    const emailHtml = await renderAsync(
      <PayoutRejectedEmail userName={userName} amount={amount} />
    );

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: userEmail,
      subject: `❗ Your Withdrawal Request for ₹${amount} Could Not Be Processed`,
      html: emailHtml,
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Error sending payout rejected email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendTestEmail() {
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: "test@example.com",
      subject: "Test Email from Molle Events",
      html: "<p>This is a test email to verify Resend configuration.</p>",
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("❌ Error sending test email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
