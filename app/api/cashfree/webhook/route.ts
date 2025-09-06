import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-webhook-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.CASHFREE_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === "payment.captured") {
      const { order_id, id: payment_id } = event.payload.payment.entity;

      const swipePurchase = await db.swipePurchase.findFirst({
        where: {
          cashfreeOrderId: order_id,
          paymentStatus: "PENDING",
        },
      });

      if (swipePurchase) {
        await db.swipePurchase.update({
          where: { id: swipePurchase.id },
          data: {
            cashfreePaymentId: payment_id,
            paymentStatus: "COMPLETED",
          },
        });

        const userPreferences = await db.userPreference.findUnique({
          where: { userId: swipePurchase.userId },
        });

        if (userPreferences) {
          const newDailyLimit = 3 + swipePurchase.swipeCount;

          await db.userPreference.update({
            where: { userId: swipePurchase.userId },
            data: {
              dailySwipeLimit: newDailyLimit,
            },
          });
        }
      } else {
        const payment = await db.payment.update({
          where: { cashfreeOrderId: order_id },
          data: {
            cashfreePaymentId: payment_id,
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
    }

    // Handle payment failed
    if (event.event === "payment.failed") {
      const { order_id } = event.payload.payment.entity;
      const { error_code, error_message } = event.payload.payment.entity;

      const swipePurchase = await db.swipePurchase.findFirst({
        where: {
          cashfreeOrderId: order_id,
          paymentStatus: "PENDING",
        },
      });

      if (swipePurchase) {
        await db.swipePurchase.update({
          where: { id: swipePurchase.id },
          data: {
            paymentStatus: "FAILED",
          },
        });
      } else {
        // Handle regular booking payments
        await db.payment.update({
          where: { cashfreeOrderId: order_id },
          data: {
            status: "FAILED",
          },
        });
      }
    }

    // Handle payment expired
    if (event.event === "payment.expired") {
      const { order_id } = event.payload.payment.entity;

      const swipePurchase = await db.swipePurchase.findFirst({
        where: {
          cashfreeOrderId: order_id,
          paymentStatus: "PENDING",
        },
      });

      if (swipePurchase) {
        await db.swipePurchase.update({
          where: { id: swipePurchase.id },
          data: {
            paymentStatus: "FAILED",
          },
        });
      } else {
        // Handle regular booking payments
        await db.payment.update({
          where: { cashfreeOrderId: order_id },
          data: {
            status: "FAILED",
          },
        });
      }
    }

    // Handle payment cancelled
    if (event.event === "payment.cancelled") {
      const { order_id } = event.payload.payment.entity;

      const swipePurchase = await db.swipePurchase.findFirst({
        where: {
          cashfreeOrderId: order_id,
          paymentStatus: "PENDING",
        },
      });

      if (swipePurchase) {
        await db.swipePurchase.update({
          where: { id: swipePurchase.id },
          data: {
            paymentStatus: "FAILED",
          },
        });
      } else {
        await db.payment.update({
          where: { cashfreeOrderId: order_id },
          data: {
            status: "FAILED",
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
