import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Store active connections
const connections = new Map<
  string,
  {
    controller: ReadableStreamDefaultController;
    userId: string;
    type: string;
  }
>();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type") || "admin";
    const lastEventId = searchParams.get("lastEventId");

    if (!userId || userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Store this connection
        const connectionId = `${userId}-${type}-${Date.now()}`;
        connections.set(connectionId, {
          controller,
          userId,
          type,
        });

        // Send initial connection message
        controller.enqueue(
          `data: ${JSON.stringify({
            type: "connected",
            timestamp: Date.now(),
          })}\n\n`
        );

        // Cleanup when connection closes
        request.signal.addEventListener("abort", () => {
          connections.delete(connectionId);
          try {
            controller.close();
          } catch (e) {
            // Connection already closed
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    console.error("SSE connection error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Utility function to broadcast messages to connected clients
export function broadcastMessage(
  data: any,
  targetUserId?: string,
  messageType?: string
) {
  const message = `data: ${JSON.stringify(data)}\n\n`;

  connections.forEach((connection, connectionId) => {
    try {
      // If targetUserId is specified, only send to that user
      if (targetUserId && connection.userId !== targetUserId) {
        return;
      }

      // If messageType is specified, only send to connections of that type
      if (messageType && connection.type !== messageType) {
        return;
      }

      connection.controller.enqueue(message);
    } catch (error) {
      // Remove broken connections
      connections.delete(connectionId);
      console.error("Failed to send SSE message:", error);
    }
  });
}

// Export function to get active connections (for debugging)
export function getActiveConnections() {
  return Array.from(connections.entries()).map(([id, conn]) => ({
    id,
    userId: conn.userId,
    type: conn.type,
  }));
}
