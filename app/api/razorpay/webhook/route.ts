import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    // Handle payment success
    if (event.event === "payment.captured") {
      const { order_id, id: payment_id } = event.payload.payment.entity;

      // Update payment and booking status
      const payment = await db.payment.update({
        where: { razorpayOrderId: order_id },
        data: {
          razorpayPaymentId: payment_id,
          status: "COMPLETED",
        },
        include: {
          booking: true,
        },
      });

      await db.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: "CONFIRMED",
        },
      });
    }

    // Handle payment failed
    if (event.event === "payment.failed") {
      const { order_id } = event.payload.payment.entity;

      await db.payment.update({
        where: { razorpayOrderId: order_id },
        data: {
          status: "FAILED",
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
