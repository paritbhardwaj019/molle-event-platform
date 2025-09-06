import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const subscriptionPayment = await db.subscriptionPayment.findUnique({
      where: { cashfreeOrderId: orderId },
      include: {
        package: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            activePackageId: true,
            subscriptionEndDate: true,
            dailySwipeRemaining: true,
          },
        },
      },
    });

    if (!subscriptionPayment) {
      return NextResponse.json(
        { error: "Subscription payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: subscriptionPayment.id,
        orderId: subscriptionPayment.cashfreeOrderId,
        paymentId: subscriptionPayment.cashfreePaymentId,
        amount: subscriptionPayment.amount,
        currency: subscriptionPayment.currency,
        status: subscriptionPayment.status,
        package: subscriptionPayment.package,
        user: subscriptionPayment.user,
        createdAt: subscriptionPayment.createdAt,
        updatedAt: subscriptionPayment.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription payment status:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription payment status" },
      { status: 500 }
    );
  }
}
