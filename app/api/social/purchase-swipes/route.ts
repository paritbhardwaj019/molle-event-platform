import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import crypto from "crypto";
import { Cashfree, CFEnvironment } from "cashfree-pg";

const purchaseSchema = z.object({
  swipeCount: z.number().min(1).max(100),
});

// Cashfree configuration
const cashfree = new Cashfree(
  CFEnvironment.PRODUCTION,
  process.env.CASHFREE_CLIENT_ID!,
  process.env.CASHFREE_CLIENT_SECRET!
);

function getSwipePrice(count: number): number {
  // Base rate per swipe
  const baseRate = 10; // ₹10 per swipe
  return Math.ceil(count * baseRate);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { swipeCount } = purchaseSchema.parse(body);

    const amount = getSwipePrice(swipeCount);

    const orderData = {
      order_amount: amount.toString(),
      order_currency: "INR",
      customer_details: {
        customer_id: session.user.id,
        customer_name: session.user.name || "Unknown",
        customer_email: session.user.email!,
        customer_phone: session.user.phone || "9999999999",
      },
      order_meta: {
        return_url: `${process.env.NEXTAUTH_URL}/dashboard/social/discover`,
      },
      order_note: `Purchase of ${swipeCount} swipes`,
      order_tags: {
        swipeCount: swipeCount.toString(),
        userId: session.user.id,
      },
    };

    const cashfreeOrder = await createCashfreeOrder(orderData);

    if (!cashfreeOrder || !cashfreeOrder.cf_order_id) {
      throw new Error("Failed to create Cashfree order");
    }

    const swipePurchase = await db.swipePurchase.create({
      data: {
        userId: session.user.id,
        swipeCount,
        amount,
        cashfreeOrderId: cashfreeOrder.cf_order_id,
        paymentStatus: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        purchaseId: swipePurchase.id,
        orderId: cashfreeOrder.cf_order_id,
        amount,
        currency: "INR",
        paymentSessionId: cashfreeOrder.payment_session_id,
        swipeCount,
        user: {
          name: session.user.name,
          email: session.user.email,
          phone: session.user.phone,
        },
        ...cashfreeOrder,
      },
    });
  } catch (error) {
    console.error("Error creating swipe purchase order:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid purchase data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, paymentId, signature } = body;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: "Missing payment verification data" },
        { status: 400 }
      );
    }

    const isValidSignature = await verifyCashfreeSignature(
      orderId,
      paymentId,
      signature
    );

    if (!isValidSignature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const swipePurchase = await db.swipePurchase.findFirst({
      where: {
        cashfreeOrderId: orderId,
        userId: session.user.id,
        paymentStatus: "PENDING",
      },
    });

    if (!swipePurchase) {
      return NextResponse.json(
        { error: "Purchase record not found" },
        { status: 404 }
      );
    }

    await db.swipePurchase.update({
      where: { id: swipePurchase.id },
      data: {
        cashfreePaymentId: paymentId,
        paymentStatus: "COMPLETED",
      },
    });

    const userPreferences = await db.userPreference.findUnique({
      where: { userId: session.user.id },
    });

    if (!userPreferences) {
      return NextResponse.json(
        { error: "User preferences not found" },
        { status: 404 }
      );
    }

    const newDailyLimit = 3 + swipePurchase.swipeCount;

    await db.userPreference.update({
      where: { userId: session.user.id },
      data: {
        dailySwipeLimit: newDailyLimit,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPreferences = await db.userPreference.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      dailySwipeLimit: userPreferences?.dailySwipeLimit || 3,
      swipesUsedToday: userPreferences?.swipesUsedToday || 0,
    });
  } catch (error) {
    console.error("Error fetching swipe limits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function createCashfreeOrder(orderData: any) {
  try {
    const response = await cashfree.PGCreateOrder(orderData);
    return response.data;
  } catch (error) {
    console.error("Error creating Cashfree order:", error);
    throw error;
  }
}

async function verifyCashfreeSignature(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  try {
    const text = orderId + "|" + paymentId;
    const generated_signature = crypto
      .createHmac("sha256", process.env.CASHFREE_WEBHOOK_SECRET!)
      .update(text)
      .digest("hex");

    return generated_signature === signature;
  } catch (error) {
    console.error("Error verifying Cashfree signature:", error);
    return false;
  }
}
