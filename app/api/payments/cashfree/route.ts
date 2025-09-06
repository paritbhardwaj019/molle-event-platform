import { NextRequest, NextResponse } from "next/server";
import { createBookingWithPayment } from "@/lib/actions/payment";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await createBookingWithPayment(body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating Cashfree order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
