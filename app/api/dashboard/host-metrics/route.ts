import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getHostMetrics } from "@/lib/actions/dashboard";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "HOST") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const metrics = await getHostMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching host metrics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
