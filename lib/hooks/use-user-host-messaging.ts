import { useState, useEffect, useCallback } from "react";
import { useRealtimeMessaging } from "./use-realtime-messaging";

export interface UserHostMessage {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  isRead: boolean;
  attachments?: any[];
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
}

export interface UserHostConversation {
  id: string;
  userId: string;
  hostId: string;
  reportedBy?: string;
  reportReason?: string;
  reportTimestamp?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  host?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  messages: UserHostMessage[];
  _count: {
    messages: number;
  };
}

export function useUserHostMessaging(userId?: string) {
  const [conversations, setConversations] = useState<UserHostConversation[]>(
    []
  );
  const [messages, setMessages] = useState<UserHostMessage[]>([]);
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
  } = useRealtimeMessaging(userId, "user-host");

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/messages/user-host");
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

        const response = await fetch(
          `/api/messages/user-host/${conversationId}`
        );
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
    async (content: string, recipientId: string, attachments?: any[]) => {
      try {
        setError(null);

        if (selectedConversationId && userId) {
          const optimisticMessage = {
            id: `temp-${Date.now()}`,
            content,
            senderId: userId,
            conversationId: selectedConversationId,
            isRead: false,
            attachments: attachments || null,
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

        const response = await fetch("/api/messages/user-host", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            recipientId,
            attachments: attachments || null,
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
      const response = await fetch("/api/messages/user-host/unread-count");
      const data = await response.json();

      if (response.ok) {
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        const response = await fetch(
          `/api/messages/user-host/${conversationId}/delete`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete conversation");
        }

        // Remove the conversation from the list
        setConversations((prev) =>
          prev.filter((conv) => conv.id !== conversationId)
        );

        // If this was the selected conversation, clear it
        if (selectedConversationId === conversationId) {
          setSelectedConversationId(null);
          setMessages([]);
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        throw err;
      }
    },
    [selectedConversationId]
  );

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
    deleteConversation,
  };
}
