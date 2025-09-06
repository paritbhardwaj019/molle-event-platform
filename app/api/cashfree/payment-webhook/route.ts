import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { verifyPayment } from "@/lib/actions/payment";
import { verifySubscriptionPayment } from "@/lib/actions/package";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-webhook-signature");

    const event = JSON.parse(body);

    switch (event.type) {
      case "PAYMENT_SUCCESS_WEBHOOK":
        return await handlePaymentSuccess(event);

      case "PAYMENT_FAILED_WEBHOOK":
        return await handlePaymentFailed(event);

      case "PAYMENT_USER_DROPPED_WEBHOOK":
        return await handlePaymentUserDropped(event);

      case "TRANSFER_FAILED":
        return await handleTransferFailed(event);

      case "TRANSFER_REJECTED":
        return await handleTransferRejected(event);

      case "TRANSFER_REVERSED":
        return await handleTransferReversed(event);

      default:
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error("Payment webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(event: any) {
  try {
    const { cf_payment_id } = event.data.payment;
    const { order_id, order_amount, order_currency } = event.data.order;
    const orderTags = event.data.order.order_tags || {};

    if (orderTags.pkgId) {
      const subscriptionPayment = await db.subscriptionPayment.findFirst({
        where: {
          cashfreeOrderId: order_id,
          status: "PENDING",
        },
      });

      if (subscriptionPayment) {
        const result = await verifySubscriptionPayment({
          orderId: order_id,
          paymentId: cf_payment_id,
          signature: "", // Not used anymore
        });

        if (!result.success) {
          console.error(
            "Subscription payment verification failed:",
            result.error
          );
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      }
    }

    if (orderTags.bid) {
      const payment = await db.payment.findFirst({
        where: {
          bookingId: orderTags.bid,
          status: "PENDING",
        },
      });

      if (payment) {
        // Verify booking payment
        const result = await verifyPayment(
          order_id,
          cf_payment_id,
          orderTags.bid
        );

        if (!result.success) {
          console.error("Booking payment verification failed:", result.error);
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      }
    }

    if (order_id) {
      const fallbackPayment = await db.payment.findFirst({
        where: {
          bookingId: orderTags.bid,
          status: "PENDING",
        },
      });

      if (fallbackPayment) {
        const result = await verifyPayment(
          order_id,
          cf_payment_id,
          orderTags.bid
        );

        if (!result.success) {
          console.error("Fallback payment verification failed:", result.error);
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      }
    }

    // Check if this is a swipe purchase
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
          cashfreePaymentId: cf_payment_id.toString(),
          paymentStatus: "COMPLETED",
        },
      });

      // Update user's daily swipe limit
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

      return NextResponse.json({ success: true });
    }

    const fallbackSubscriptionPayment = await db.subscriptionPayment.findFirst({
      where: {
        cashfreeOrderId: order_id,
        status: "PENDING",
      },
    });

    if (fallbackSubscriptionPayment) {
      const result = await verifySubscriptionPayment({
        orderId: order_id,
        paymentId: cf_payment_id,
        signature: "", // Not used anymore
      });

      if (!result.success) {
        console.error(
          "Fallback subscription payment verification failed:",
          result.error
        );
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling payment success:", error);
    return NextResponse.json(
      { error: "Failed to process payment success" },
      { status: 500 }
    );
  }
}

async function handlePaymentFailed(event: any) {
  try {
    const { order_id } = event.data.payment;
    const { error_code, error_description } = event.data.error_details || {};

    await updatePaymentStatusToFailed(
      order_id,
      "PAYMENT_FAILED",
      error_description
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling payment failure:", error);
    return NextResponse.json(
      { error: "Failed to process payment failure" },
      { status: 500 }
    );
  }
}

async function handlePaymentUserDropped(event: any) {
  try {
    const { order_id } = event.data.payment;

    await updatePaymentStatusToFailed(
      order_id,
      "USER_DROPPED",
      "User dropped payment"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling payment user dropped:", error);
    return NextResponse.json(
      { error: "Failed to process payment user dropped" },
      { status: 500 }
    );
  }
}

async function handleTransferFailed(event: any) {
  try {
    const { transferId, referenceId, reason } = event;

    await updatePaymentStatusToFailed(transferId, "TRANSFER_FAILED", reason);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling transfer failure:", error);
    return NextResponse.json(
      { error: "Failed to process transfer failure" },
      { status: 500 }
    );
  }
}

async function handleTransferRejected(event: any) {
  try {
    const { transferId, referenceId, reason } = event;

    await updatePaymentStatusToFailed(transferId, "TRANSFER_REJECTED", reason);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling transfer rejection:", error);
    return NextResponse.json(
      { error: "Failed to process transfer rejection" },
      { status: 500 }
    );
  }
}

async function handleTransferReversed(event: any) {
  try {
    const { transferId, referenceId, reason } = event;

    await updatePaymentStatusToFailed(transferId, "TRANSFER_REVERSED", reason);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling transfer reversal:", error);
    return NextResponse.json(
      { error: "Failed to process transfer reversal" },
      { status: 500 }
    );
  }
}

async function updatePaymentStatusToFailed(
  orderId: string,
  failureType: string,
  reason: string
) {
  await db.subscriptionPayment.updateMany({
    where: {
      cashfreeOrderId: orderId,
      status: "PENDING",
    },
    data: {
      status: "FAILED",
    },
  });

  const payments = await db.payment.findMany({
    where: {
      cashfreeOrderId: orderId,
      status: "PENDING",
    },
    include: {
      booking: true,
    },
  });

  for (const payment of payments) {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });

    if (payment.booking) {
      await db.ticketData.deleteMany({
        where: { bookingId: payment.booking.id },
      });
    }
  }

  await db.swipePurchase.updateMany({
    where: {
      cashfreeOrderId: orderId,
      paymentStatus: "PENDING",
    },
    data: {
      paymentStatus: "FAILED",
    },
  });
}
