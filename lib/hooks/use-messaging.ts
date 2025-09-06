import { useState, useEffect, useCallback } from "react";
import { useRealtimeMessaging } from "./use-realtime-messaging";

export interface Message {
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

export interface Conversation {
  id: string;
  hostId: string;
  adminId: string;
  createdAt: string;
  updatedAt: string;
  host?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  admin?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  messages: Message[];
  _count: {
    messages: number;
  };
}

export function useMessaging(userId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  // Use real-time messaging
  const {
    messages: realtimeMessages,
    isConnected,
    getConversationMessages,
    clearConversationMessages,
    addOptimisticMessage,
  } = useRealtimeMessaging(userId, "admin");

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/messages");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch conversations");
      }

      setConversations(data.conversations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      try {
        setLoading(true);
        setError(null);
        setSelectedConversationId(conversationId);

        const response = await fetch(`/api/messages/${conversationId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch messages");
        }

        // Clear real-time messages and set initial messages
        clearConversationMessages();
        setMessages(data.messages || []);

        // Refresh unread count after fetching messages (they get marked as read)
        fetchUnreadCount();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [clearConversationMessages]
  );

  const sendMessage = useCallback(
    async (content: string, recipientId: string) => {
      try {
        setError(null);

        // Add optimistic message
        if (selectedConversationId && userId) {
          const optimisticMessage = {
            id: `temp-${Date.now()}`,
            content,
            senderId: userId,
            conversationId: selectedConversationId,
            isRead: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sender: {
              id: userId,
              name: "You",
              avatar: "",
              role: "USER",
            },
          };
          addOptimisticMessage(optimisticMessage);
        }

        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            recipientId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to send message");
        }

        // Real-time messaging will handle updating the UI automatically
        // No need to fetch conversations here as it causes unnecessary delay
        return data.message;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        throw err;
      }
    },
    [selectedConversationId, userId, addOptimisticMessage]
  );

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/messages/unread-count");
      const data = await response.json();

      if (response.ok) {
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  // Merge real-time messages with current messages
  useEffect(() => {
    if (selectedConversationId) {
      const conversationMessages = getConversationMessages(
        selectedConversationId
      );
      if (conversationMessages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((msg) => msg.id));
          const newMessages = conversationMessages.filter(
            (msg) => !existingIds.has(msg.id)
          );
          return [...prev, ...newMessages];
        });
      }
    }
  }, [realtimeMessages, selectedConversationId, getConversationMessages]);

  useEffect(() => {
    fetchUnreadCount();
    // Set up polling for unread count every 30 seconds (as backup)
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return {
    conversations,
    messages,
    unreadCount,
    loading,
    error,
    isConnected,
    fetchConversations,
    fetchMessages,
    sendMessage,
    fetchUnreadCount,
  };
}
