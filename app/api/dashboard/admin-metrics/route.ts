import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAdminMetrics } from "@/lib/actions/dashboard";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const metrics = await getAdminMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching admin metrics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
