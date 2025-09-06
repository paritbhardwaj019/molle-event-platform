import { NextRequest, NextResponse } from "next/server";
import { searchEvents } from "@/lib/actions/event";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query parameter is required" },
        { status: 400 }
      );
    }

    const result = await searchEvents(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
