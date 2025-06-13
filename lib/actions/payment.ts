"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import Razorpay from "razorpay";
import crypto from "crypto";
import { calculateFees } from "./settings";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

interface CreateBookingData {
  eventId: string;
  packageId: string;
  ticketCount: number;
  totalAmount: number;
  referralCode?: string;
  referralDiscount?: number;
}

export async function createBookingWithPayment(data: CreateBookingData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    // Get event details to find the host
    const event = await db.event.findUnique({
      where: { id: data.eventId },
      include: { host: true },
    });

    if (!event) {
      return { error: "Event not found" };
    }

    // Calculate fees based on the base amount
    const baseAmount = Number(data.totalAmount);
    const fees = await calculateFees(baseAmount);

    // If referral code is provided, validate it
    let referralLinkId: string | null = null;
    if (data.referralCode) {
      const referralLink = await db.referralLink.findUnique({
        where: {
          referralCode: data.referralCode,
          type: "EVENT",
          eventId: data.eventId,
        },
        include: {
          referrer: true,
        },
      });

      if (!referralLink) {
        return { error: "Invalid referral code" };
      }

      referralLinkId = referralLink.id;
    }

    const booking = await db.booking.create({
      data: {
        bookingNumber: `BK${Date.now()}`,
        status: "PENDING",
        ticketCount: data.ticketCount,
        totalAmount: data.totalAmount,
        userId: session.user.id,
        eventId: data.eventId,
        packageId: data.packageId,
        referralLinkId: referralLinkId,
      },
      include: {
        user: true,
        event: true,
      },
    });

    // Create Razorpay order
    const orderData = {
      amount: Math.round(data.totalAmount * 100), // Convert to paise
      currency: "INR",
      receipt: booking.bookingNumber,
      notes: {
        bookingId: booking.id,
        eventId: data.eventId,
        userId: session.user.id,
        referralCode: data.referralCode || "",
        baseAmount: baseAmount,
        platformFee: fees.totalPlatformFee,
        hostFee: fees.hostFee,
      },
    } as const;

    const order = await razorpay.orders.create(orderData);
    if (!order || !order.id) {
      throw new Error("Failed to create Razorpay order");
    }

    // Create payment record
    await db.payment.create({
      data: {
        razorpayOrderId: order.id,
        amount: data.totalAmount,
        status: "PENDING",
        bookingId: booking.id,
      },
    });

    return {
      success: true,
      data: {
        bookingId: booking.id,
        orderId: order.id,
        amount: data.totalAmount,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID,
        bookingNumber: booking.bookingNumber,
        user: {
          name: booking.user.name,
          email: booking.user.email,
          phone: booking.user.phone,
        },
      },
    };
  } catch (error) {
    console.error("Error creating booking with payment:", error);
    return { error: "Failed to create booking" };
  }
}

export async function verifyPayment(
  orderId: string,
  paymentId: string,
  signature: string
) {
  try {
    // Verify payment signature
    const text = orderId + "|" + paymentId;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest("hex");

    if (generated_signature !== signature) {
      return { error: "Invalid payment signature" };
    }

    // Update payment and booking status
    const payment = await db.payment.update({
      where: { razorpayOrderId: orderId },
      data: {
        razorpayPaymentId: paymentId,
        status: "COMPLETED",
      },
      include: {
        booking: {
          include: {
            user: true,
            event: {
              include: {
                host: true,
              },
            },
            referralLink: {
              include: {
                referrer: true,
                event: true,
              },
            },
          },
        },
      },
    });

    // Update booking status
    await db.booking.update({
      where: { id: payment.bookingId },
      data: {
        status: "CONFIRMED",
      },
    });

    // Calculate fees for this payment
    const baseAmount = Number(payment.amount);
    const fees = await calculateFees(baseAmount);

    await db.user.update({
      where: { id: payment.booking.event.host.id },
      data: {
        walletBalance: {
          increment: Number(fees.hostGets),
        },
      },
    });

    if (payment.booking.referralLink?.referrer) {
      const referralAmount = Number(fees.hostGets) * 0.03;

      await db.user.update({
        where: { id: payment.booking.referralLink.referrer.id },
        data: {
          walletBalance: {
            increment: referralAmount,
          },
        },
      });

      await db.user.update({
        where: { id: payment.booking.event.host.id },
        data: {
          walletBalance: {
            decrement: referralAmount,
          },
        },
      });

      const existingReferral = await db.referral.findFirst({
        where: {
          referrerId: payment.booking.referralLink.referrer.id,
          referredUserId: payment.booking.user.id,
        },
      });

      if (!existingReferral) {
        await db.referral.create({
          data: {
            referralCode: payment.booking.referralLink.referralCode,
            commission: referralAmount,
            isCommissionPaid: true,
            referrerId: payment.booking.referralLink.referrer.id,
            referredUserId: payment.booking.user.id,
            referralLinkId: payment.booking.referralLink.id,
          },
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error verifying payment:", error);
    return { error: "Failed to verify payment" };
  }
}
