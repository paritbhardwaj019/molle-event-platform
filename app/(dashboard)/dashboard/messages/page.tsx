"use client";

import { useState, useEffect, useRef } from "react";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import {
  useMessaging,
  type Conversation,
  type Message,
} from "@/lib/hooks/use-messaging";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StartConversation } from "@/components/messaging/start-conversation";
import { Send, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function MessagesPage() {
  const { user } = useLoggedInUser();
  const {
    conversations,
    messages,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
  } = useMessaging();

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();

      // Fetch admin ID for hosts
      if (user.role === "HOST") {
        fetch("/api/admin/info")
          .then((res) => res.json())
          .then((data) => {
            if (data.adminId) {
              setAdminId(data.adminId);
            }
          })
          .catch(console.error);
      }
    }
  }, [user, fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    const recipientId =
      user?.role === "HOST"
        ? selectedConversation.adminId
        : selectedConversation.hostId;

    try {
      setSending(true);
      await sendMessage(newMessage.trim(), recipientId);
      setNewMessage("");
      // Refresh messages after sending
      fetchMessages(selectedConversation.id);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (user?.role === "HOST") {
      return conversation.admin?.name || "Admin";
    } else {
      return conversation.host?.name || "Host";
    }
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (user?.role === "HOST") {
      return conversation.admin?.avatar;
    } else {
      return conversation.host?.avatar;
    }
  };

  const getLastMessage = (conversation: Conversation) => {
    return conversation.messages[0];
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const ConversationSkeleton = () => (
    <div className="p-3 space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );

  const MessagesSkeleton = () => (
    <div className="p-4 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
        >
          <Skeleton
            className={`h-16 ${i % 2 === 0 ? "w-48" : "w-32"} rounded-lg`}
          />
        </div>
      ))}
    </div>
  );

  if (!user) {
    return <div>Please log in to access messages.</div>;
  }

  if (user.role !== "HOST" && user.role !== "ADMIN") {
    return <div>Access denied. Only hosts and admins can access messages.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gray-50">
      {/* Conversations List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageCircle className="mr-2 h-5 w-5" />
            Messages
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <ConversationSkeleton />
          ) : conversations.length === 0 ? (
            <div className="p-4">
              {user.role === "HOST" && adminId ? (
                <StartConversation
                  adminId={adminId}
                  onMessageSent={() => {
                    fetchConversations();
                  }}
                />
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">
                    {user.role === "HOST"
                      ? "Loading..."
                      : "No conversations yet. Hosts will appear here when they message you."}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map((conversation) => {
                const lastMessage = getLastMessage(conversation);
                const unreadCount = conversation._count.messages;

                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedConversation?.id === conversation.id
                        ? "bg-purple-50 border border-purple-200 shadow-sm"
                        : "hover:bg-gray-50 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={getConversationAvatar(conversation)}
                          alt={getConversationTitle(conversation)}
                        />
                        <AvatarFallback className="bg-purple-100 text-purple-600 font-medium">
                          {getInitials(getConversationTitle(conversation))}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getConversationTitle(conversation)}
                          </p>
                          {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>

                        {lastMessage && (
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-500 truncate">
                              {lastMessage.content}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDistanceToNow(
                                new Date(lastMessage.createdAt),
                                { addSuffix: true }
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={getConversationAvatar(selectedConversation)}
                    alt={getConversationTitle(selectedConversation)}
                  />
                  <AvatarFallback className="bg-purple-100 text-purple-600 font-medium text-xs">
                    {getInitials(getConversationTitle(selectedConversation))}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {getConversationTitle(selectedConversation)}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {user.role === "HOST" ? "Admin" : "Host"}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading && messages.length === 0 ? (
                <MessagesSkeleton />
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex items-end space-x-2 animate-in fade-in duration-300 ${
                      message.senderId === user.id
                        ? "justify-end flex-row-reverse space-x-reverse"
                        : "justify-start"
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {message.senderId !== user.id && (
                      <Avatar className="h-6 w-6 mb-1">
                        <AvatarImage
                          src={message.sender.avatar || undefined}
                          alt={message.sender.name}
                        />
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                          {getInitials(message.sender.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user.id
                          ? "bg-purple-600 text-white"
                          : "bg-white border border-gray-200 text-gray-900"
                      }`}
                    >
                      {message.senderId !== user.id && (
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          {message.sender.name}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.senderId === user.id
                            ? "text-purple-200"
                            : "text-gray-500"
                        }`}
                      >
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {message.senderId === user.id && (
                      <Avatar className="h-6 w-6 mb-1">
                        <AvatarImage
                          src={user.avatar || undefined}
                          alt={user.name}
                        />
                        <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button type="submit" disabled={sending || !newMessage.trim()}>
                  {sending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a conversation from the list to start messaging.
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
