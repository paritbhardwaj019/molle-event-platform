import { NextRequest, NextResponse } from "next/server";
import { verifySubscriptionPayment } from "@/lib/actions/package";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      orderId,
      paymentId,
      signature,
      orderAmount,
      orderCurrency,
      orderStatus,
      errorCode,
      errorMessage,
    } = body;

    if (
      body?.data?.payment?.payment_status === "FAILED" ||
      body?.data?.payment?.payment_status === "EXPIRED" ||
      body?.data?.payment?.payment_status === "CANCELLED"
    ) {
      await db.subscriptionPayment.updateMany({
        where: {
          cashfreeOrderId: body?.data?.order?.order_id,
          status: "PENDING",
        },
        data: {
          status: "FAILED",
        },
      });

      return NextResponse.json({ success: true });
    }

    if (body?.data?.payment?.payment_status !== "SUCCESS") {
      return NextResponse.json({ success: true });
    }

    const result = await verifySubscriptionPayment({
      orderId: body.data.order.order_id,
      paymentId: body.data.payment.payment_id,
      signature,
    });

    if (!result.success) {
      await db.subscriptionPayment.updateMany({
        where: {
          cashfreeOrderId: body.data.order.order_id,
          status: "PENDING",
        },
        data: {
          status: "FAILED",
        },
      });

      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
