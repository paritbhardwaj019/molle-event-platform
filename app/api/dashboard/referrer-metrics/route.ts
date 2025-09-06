import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReferrerMetrics } from "@/lib/actions/dashboard";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "REFERRER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const metrics = await getReferrerMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching referrer metrics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
