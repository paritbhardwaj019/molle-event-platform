import { useState, useEffect, useCallback, useRef } from "react";

export interface RealtimeMessage {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
}

export interface RealtimeConversation {
  id: string;
  lastMessage?: RealtimeMessage;
  unreadCount: number;
}

export function useRealtimeMessaging(
  userId: string | undefined,
  conversationType: "admin" | "user-host"
) {
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [conversations, setConversations] = useState<RealtimeConversation[]>(
    []
  );
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastEventId = useRef<string | null>(null);

  const connect = useCallback(() => {
    if (!userId || eventSourceRef.current) return;

    const url = `/api/realtime/messages?userId=${userId}&type=${conversationType}${
      lastEventId.current ? `&lastEventId=${lastEventId.current}` : ""
    }`;

    eventSourceRef.current = new EventSource(url);

    eventSourceRef.current.onopen = () => {
      setIsConnected(true);
      console.log("Real-time messaging connected");
    };

    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        lastEventId.current = event.lastEventId || null;

        switch (data.type) {
          case "new_message":
            setMessages((prev) => {
              if (prev.some((msg) => msg.id === data.message.id)) {
                return prev;
              }
              return [...prev, data.message];
            });

            // Update conversation with new message
            setConversations((prev) => {
              return prev.map((conv) => {
                if (conv.id === data.message.conversationId) {
                  return {
                    ...conv,
                    lastMessage: data.message,
                    unreadCount:
                      data.message.senderId !== userId
                        ? conv.unreadCount + 1
                        : conv.unreadCount,
                  };
                }
                return conv;
              });
            });
            break;

          case "message_read":
            setMessages((prev) => {
              return prev.map((msg) => {
                if (
                  msg.conversationId === data.conversationId &&
                  msg.senderId !== userId
                ) {
                  return { ...msg, isRead: true };
                }
                return msg;
              });
            });

            // Update conversation unread count
            setConversations((prev) => {
              return prev.map((conv) => {
                if (conv.id === data.conversationId) {
                  return { ...conv, unreadCount: 0 };
                }
                return conv;
              });
            });
            break;

          case "conversation_update":
            setConversations((prev) => {
              const existingIndex = prev.findIndex(
                (conv) => conv.id === data.conversation.id
              );
              if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = data.conversation;
                return updated;
              } else {
                return [...prev, data.conversation];
              }
            });
            break;

          default:
            console.log("Unknown real-time event:", data);
        }
      } catch (error) {
        console.error("Failed to parse real-time message:", error);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      setIsConnected(false);
      console.error("Real-time messaging error:", error);

      // Close and reconnect after a delay
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      setTimeout(() => {
        connect();
      }, 3000);
    };
  }, [userId, conversationType]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Filter messages for a specific conversation
  const getConversationMessages = useCallback(
    (conversationId: string) => {
      return messages.filter((msg) => msg.conversationId === conversationId);
    },
    [messages]
  );

  // Clear messages for a specific conversation (useful when switching conversations)
  const clearConversationMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Add a new message optimistically (before server confirmation)
  const addOptimisticMessage = useCallback((message: RealtimeMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId, connect, disconnect]);

  return {
    messages,
    conversations,
    isConnected,
    getConversationMessages,
    clearConversationMessages,
    addOptimisticMessage,
    reconnect: connect,
  };
}
