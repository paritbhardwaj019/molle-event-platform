"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { useUserHostMessaging } from "@/lib/hooks/use-user-host-messaging";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send,
  MessageCircle,
  ArrowLeft,
  Users,
  Loader2,
  Menu,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { EmojiPicker } from "@/components/chat/emoji-picker";
import {
  AttachmentUpload,
  AttachmentDisplay,
} from "@/components/chat/attachment-upload";
import { ChatActions } from "@/components/chat/chat-actions";
import type { ChatAttachment } from "@/types/chat";
import type {
  UserHostMessage as ChatMessage,
  UserHostConversation as ChatConversation,
} from "@/lib/hooks/use-user-host-messaging";

interface ChatPageProps {}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useLoggedInUser();
  const {
    conversations,
    messages,
    loading,
    error,
    isConnected,
    fetchConversations,
    fetchMessages,
    sendMessage,
    deleteConversation,
  } = useUserHostMessaging(user?.id);

  const [selectedConversation, setSelectedConversation] =
    useState<ChatConversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to fix messages array reference issue
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);

  const hostId = searchParams.get("hostId");
  const eventTitle = searchParams.get("eventTitle");

  // Mobile bottom navigation height
  const BOTTOM_NAV_HEIGHT = 72;

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (user) {
      fetchConversations();
    }
  }, [user, authLoading, fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  useEffect(() => {
    setLocalMessages(messages);
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (hostId && !selectedConversation && !isDeleting) {
      const existingConversation = conversations.find(
        (conv) => conv.hostId === hostId || conv.host?.id === hostId
      );
      if (existingConversation) {
        setSelectedConversation(existingConversation);
      }
    }
  }, [hostId, conversations, selectedConversation, isDeleting]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || sending) return;

    let recipientId =
      selectedConversation?.hostId || selectedConversation?.host?.id;

    if (!recipientId && hostId) {
      recipientId = hostId;
    }

    if (!recipientId) {
      toast.error("Cannot send message: recipient not found");
      return;
    }

    const messageContent = newMessage.trim();

    try {
      setSending(true);
      // Clear the input immediately for better UX
      setNewMessage("");
      setAttachments([]);

      await sendMessage(messageContent, recipientId, attachments);

      // If no conversation was selected but we have a hostId, create/find the conversation
      if (!selectedConversation && hostId) {
        // Wait a bit for the message to be processed and conversation to be created
        setTimeout(async () => {
          await fetchConversations();
          const found = conversations.find(
            (conv) => conv.hostId === hostId || conv.host?.id === hostId
          );
          if (found) {
            setSelectedConversation(found);
          }
        }, 500);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
      setNewMessage(messageContent);
      setAttachments(attachments);
    } finally {
      setSending(false);
    }
  };

  const getConversationTitle = (conversation: ChatConversation) => {
    if (user?.role === "HOST") {
      return conversation.user?.name || "User";
    } else {
      return conversation.host?.name || "Host";
    }
  };

  const getConversationAvatar = (conversation: ChatConversation) => {
    if (user?.role === "HOST") {
      return conversation.user?.avatar;
    } else {
      return conversation.host?.avatar;
    }
  };

  const getLastMessage = (conversation: ChatConversation) => {
    return conversation.messages?.[0];
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEmojiSelect = (emoji: any) => {
    setNewMessage((prev) => prev + emoji.native);
  };

  const handleAttachmentUpload = (attachment: ChatAttachment) => {
    setAttachments((prev) => [...prev, attachment]);
  };

  const handleAttachmentRemove = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectConversation = (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    // On mobile, selecting a conversation automatically shows the chat view
  };

  const handleBackToConversations = () => {
    setSelectedConversation(null);
    // This will show the conversations list on mobile
  };

  const handleConversationDelete = async (
    deletedConversation?: ChatConversation
  ) => {
    const conversationToDelete = deletedConversation || selectedConversation;

    if (conversationToDelete) {
      try {
        setIsDeleting(true);

        // If no conversation was passed, use the selected conversation
        if (!deletedConversation) {
          await deleteConversation(conversationToDelete.id);
        }

        // Check if the hostId from URL matches the conversation's host
        const conversationHostId =
          conversationToDelete.hostId || conversationToDelete.host?.id;
        const shouldRemoveParams =
          hostId && conversationHostId && hostId === conversationHostId;

        // Remove URL parameters first if the hostId matches the deleted conversation
        if (shouldRemoveParams) {
          console.log(
            "Removing URL parameters for deleted conversation:",
            conversationToDelete.id
          );
          const url = new URL(window.location.href);
          url.searchParams.delete("hostId");
          url.searchParams.delete("eventTitle");
          window.history.replaceState({}, "", url.toString());
          console.log("URL after parameter removal:", url.toString());
        }

        // Reset conversation state - clear selected conversation and messages
        setSelectedConversation(null);
        setLocalMessages([]);

        // Refresh conversations list to reflect the deletion
        await fetchConversations();

        // Refresh the page to ensure complete UI reset
        window.location.reload();
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      } finally {
        setIsDeleting(false);
      }
    }
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Please log in to access messages
          </h3>
          <p className="text-sm">
            You need to be logged in to view and send messages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-[#121212] flex relative overflow-hidden"
      style={{
        height:
          isMobile && user ? `calc(100vh - ${BOTTOM_NAV_HEIGHT}px)` : "100vh",
      }}
    >
      {/* Sidebar - Conversations List */}
      <div
        className={`
        ${
          isMobile
            ? `absolute inset-0 z-40 bg-gray-900 transition-transform duration-300 ease-in-out ${
                selectedConversation ? "-translate-x-full" : "translate-x-0"
              }`
            : "w-80 relative flex-shrink-0"
        } 
        bg-gray-900 border-r border-gray-700 flex flex-col
      `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Messages
              {isConnected && (
                <div className="ml-2 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  <span className="text-xs text-green-300">Live</span>
                </div>
              )}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
          {eventTitle && (
            <p className="text-sm text-gray-400 mt-1">From: {eventTitle}</p>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <ConversationSkeleton />
          ) : conversations.length === 0 ? (
            <div className="p-4">
              <div className="text-center text-gray-500 py-8">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm">
                  {user?.role === "HOST"
                    ? "No conversations yet. Users will appear here when they message you."
                    : "No conversations yet. Start chatting with hosts!"}
                </p>
                {hostId && !selectedConversation && (
                  <p className="text-xs text-gray-600 mt-2">
                    Send a message below to start the conversation.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-2 pb-6">
              {conversations.map((conversation) => {
                const lastMessage = getLastMessage(conversation);
                const title = getConversationTitle(conversation);
                const avatar = getConversationAvatar(conversation);
                const isSelected = selectedConversation?.id === conversation.id;

                return (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-purple-600/20 border border-purple-500/30"
                        : "hover:bg-gray-800"
                    }`}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={avatar || undefined} />
                        <AvatarFallback className="bg-purple-100 text-purple-700">
                          {getInitials(title)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium truncate">
                            {title}
                          </p>
                          <div className="flex items-center space-x-2">
                            {lastMessage && (
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(
                                  new Date(lastMessage.createdAt),
                                  {
                                    addSuffix: true,
                                  }
                                )}
                              </span>
                            )}
                            <ChatActions
                              conversationId={conversation.id}
                              conversation={conversation}
                              onDelete={handleConversationDelete}
                              disabled={sending}
                            />
                          </div>
                        </div>
                        {lastMessage && (
                          <p className="text-sm text-gray-400 truncate">
                            {lastMessage.senderId === user?.id ? "You: " : ""}
                            {lastMessage.content}
                          </p>
                        )}
                        {conversation._count?.messages > 0 && (
                          <Badge
                            variant="secondary"
                            className="mt-1 text-xs bg-purple-600 text-white"
                          >
                            {conversation._count.messages}
                          </Badge>
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

      {/* Chat Area */}
      <div
        className={`flex-1 flex flex-col ${
          isMobile
            ? `absolute inset-0 z-40 bg-[#121212] transition-transform duration-300 ease-in-out ${
                selectedConversation || hostId
                  ? "translate-x-0"
                  : "translate-x-full"
              }`
            : ""
        }`}
      >
        {selectedConversation || hostId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-900 flex-shrink-0">
              <div className="flex items-center space-x-3">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToConversations}
                    className="text-gray-400 hover:text-white p-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}
                <Avatar>
                  <AvatarImage
                    src={
                      selectedConversation
                        ? getConversationAvatar(selectedConversation)
                        : undefined
                    }
                  />
                  <AvatarFallback className="bg-purple-100 text-purple-700">
                    {selectedConversation
                      ? getInitials(getConversationTitle(selectedConversation))
                      : "H"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">
                    {selectedConversation
                      ? getConversationTitle(selectedConversation)
                      : eventTitle || "New Conversation"}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">
                    {selectedConversation
                      ? user?.role === "HOST"
                        ? "Customer"
                        : "Event Host"
                      : "Start a new conversation"}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading && localMessages.length === 0 ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        i % 2 === 0 ? "justify-end" : "justify-start"
                      }`}
                    >
                      <Skeleton className="h-12 w-64 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : localMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                localMessages.map((message) => {
                  const isOwn = message.senderId === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className="flex items-start space-x-2 max-w-[85%] sm:max-w-xs lg:max-w-md">
                        {!isOwn && (
                          <Avatar className="w-6 h-6">
                            <AvatarImage
                              src={message.sender?.avatar || undefined}
                            />
                            <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                              {getInitials(message.sender?.name || "U")}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isOwn
                              ? "bg-purple-600 text-white"
                              : "bg-gray-700 text-white"
                          }`}
                        >
                          {message.content && (
                            <p className="text-sm">{message.content}</p>
                          )}
                          {message.attachments &&
                            message.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map(
                                  (attachment: any, index: number) => (
                                    <AttachmentDisplay
                                      key={index}
                                      attachment={attachment}
                                    />
                                  )
                                )}
                              </div>
                            )}
                          <span className="text-xs opacity-70">
                            {new Date(message.createdAt).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                        {isOwn && (
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={user?.avatar || undefined} />
                            <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                              {getInitials(user?.name || "U")}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700 bg-gray-900 flex-shrink-0">
              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {attachments.map((attachment, index) => (
                    <AttachmentDisplay
                      key={index}
                      attachment={attachment}
                      onRemove={() => handleAttachmentRemove(index)}
                    />
                  ))}
                </div>
              )}

              <form
                onSubmit={handleSendMessage}
                className="flex items-end space-x-2"
              >
                <div className="flex items-center space-x-1">
                  <EmojiPicker
                    onEmojiSelect={handleEmojiSelect}
                    disabled={sending}
                  />
                  <AttachmentUpload
                    onAttachmentUpload={handleAttachmentUpload}
                    disabled={sending}
                  />
                </div>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    selectedConversation
                      ? "Type your message..."
                      : "Type a message to start the conversation..."
                  }
                  disabled={sending}
                  className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400 min-h-[40px] text-base"
                />
                <Button
                  type="submit"
                  disabled={
                    (!newMessage.trim() && attachments.length === 0) || sending
                  }
                  className="bg-purple-600 hover:bg-purple-700 min-h-[40px] px-3"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : !isMobile ? (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center text-gray-500 max-w-md mx-auto">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Welcome to Messages
                </h3>
                <p className="text-sm">
                  Select a conversation from the sidebar to start chatting
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#121212] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-white">Loading chat...</p>
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
