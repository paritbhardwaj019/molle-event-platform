import { NextRequest, NextResponse } from "next/server";
import { verifySubscriptionPayment } from "@/lib/actions/package";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    console.log("Subscription webhook received");

    const body = await request.json();
    console.log("Webhook body:", JSON.stringify(body, null, 2));

    // Safely extract data with fallbacks
    const orderId = body?.data?.order?.order_id;
    const paymentId = body?.data?.payment?.payment_id;
    const paymentStatus = body?.data?.payment?.payment_status;
    const signature = body?.signature;

    // Validate required fields
    if (!orderId) {
      console.error("Missing order_id in webhook payload");
      return NextResponse.json({ success: true }); // Return success to prevent retries
    }

    console.log(
      `Processing webhook for order: ${orderId}, payment: ${paymentId}, status: ${paymentStatus}`
    );

    // Handle failed/expired/cancelled payments
    if (
      paymentStatus === "FAILED" ||
      paymentStatus === "EXPIRED" ||
      paymentStatus === "CANCELLED"
    ) {
      try {
        await db.subscriptionPayment.updateMany({
          where: {
            cashfreeOrderId: orderId,
            status: "PENDING",
          },
          data: {
            status: "FAILED",
          },
        });
        console.log(`Updated payment status to FAILED for order: ${orderId}`);
      } catch (dbError) {
        console.error("Error updating payment status to FAILED:", dbError);
      }

      return NextResponse.json({ success: true });
    }

    // Skip processing if payment is not successful
    if (paymentStatus !== "SUCCESS") {
      console.log(`Payment status is ${paymentStatus}, skipping verification`);
      return NextResponse.json({ success: true });
    }

    // Validate required fields for successful payment
    if (!paymentId) {
      console.error("Missing payment_id for successful payment");
      await db.subscriptionPayment.updateMany({
        where: {
          cashfreeOrderId: orderId,
          status: "PENDING",
        },
        data: {
          status: "FAILED",
        },
      });
      return NextResponse.json({ success: true });
    }

    // Verify subscription payment
    try {
      const result = await verifySubscriptionPayment({
        orderId,
        paymentId: paymentId.toString(), // Ensure it's a string
        signature: signature || "", // Provide fallback
      });

      if (!result.success) {
        console.error("Payment verification failed:", result.error);

        try {
          await db.subscriptionPayment.updateMany({
            where: {
              cashfreeOrderId: orderId,
              status: "PENDING",
            },
            data: {
              status: "FAILED",
            },
          });
        } catch (dbError) {
          console.error(
            "Error updating payment status to FAILED after verification failure:",
            dbError
          );
        }

        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      console.log(`Payment verification successful for order: ${orderId}`);
      return NextResponse.json({ success: true });
    } catch (verificationError) {
      console.error("Error during payment verification:", verificationError);

      try {
        await db.subscriptionPayment.updateMany({
          where: {
            cashfreeOrderId: orderId,
            status: "PENDING",
          },
          data: {
            status: "FAILED",
          },
        });
      } catch (dbError) {
        console.error(
          "Error updating payment status to FAILED after verification error:",
          dbError
        );
      }

      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in subscription webhook:", error);
    // Always return success to prevent Cashfree from retrying
    // Log the error but don't crash the service
    return NextResponse.json({ success: true });
  }
}
