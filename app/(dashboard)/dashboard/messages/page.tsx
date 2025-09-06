"use client";

import { useState, useEffect, useRef } from "react";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import {
  useMessaging,
  type Conversation,
  type Message,
} from "@/lib/hooks/use-messaging";
import { useUserHostMessaging } from "@/lib/hooks/use-user-host-messaging";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StartConversation } from "@/components/messaging/start-conversation";
import { Send, MessageCircle, Users, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function MessagesPage() {
  const { user } = useLoggedInUser();

  // Admin messages hook
  const {
    conversations: adminConversations,
    messages: adminMessages,
    loading: adminLoading,
    error: adminError,
    isConnected: adminConnected,
    fetchConversations: fetchAdminConversations,
    fetchMessages: fetchAdminMessages,
    sendMessage: sendAdminMessage,
  } = useMessaging(user?.id);

  // User-host messages hook
  const {
    conversations: userHostConversations,
    messages: userHostMessages,
    loading: userHostLoading,
    error: userHostError,
    isConnected: userHostConnected,
    fetchConversations: fetchUserHostConversations,
    fetchMessages: fetchUserHostMessages,
    sendMessage: sendUserHostMessage,
  } = useUserHostMessaging(user?.id);

  const [adminSelectedConversation, setAdminSelectedConversation] =
    useState<Conversation | null>(null);
  const [userHostSelectedConversation, setUserHostSelectedConversation] =
    useState<any>(null);
  const [newAdminMessage, setNewAdminMessage] = useState("");
  const [newUserHostMessage, setNewUserHostMessage] = useState("");
  const [sendingAdmin, setSendingAdmin] = useState(false);
  const [sendingUserHost, setSendingUserHost] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("users");
  const adminMessagesEndRef = useRef<HTMLDivElement>(null);
  const userHostMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      if (user.role === "HOST" || user.role === "ADMIN") {
        fetchAdminConversations();
      }
      if (user.role === "HOST") {
        fetchUserHostConversations();
      }

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
  }, [user, fetchAdminConversations, fetchUserHostConversations]);

  useEffect(() => {
    if (adminSelectedConversation) {
      fetchAdminMessages(adminSelectedConversation.id);
    }
  }, [adminSelectedConversation, fetchAdminMessages]);

  useEffect(() => {
    if (userHostSelectedConversation) {
      fetchUserHostMessages(userHostSelectedConversation.id);
    }
  }, [userHostSelectedConversation, fetchUserHostMessages]);

  useEffect(() => {
    adminMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [adminMessages]);

  useEffect(() => {
    userHostMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [userHostMessages]);

  const handleSendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminMessage.trim() || !adminSelectedConversation || sendingAdmin)
      return;

    const recipientId =
      user?.role === "HOST"
        ? adminSelectedConversation.adminId
        : adminSelectedConversation.hostId;

    try {
      setSendingAdmin(true);
      await sendAdminMessage(newAdminMessage.trim(), recipientId);
      setNewAdminMessage("");
    } catch (error) {
      console.error("Failed to send admin message:", error);
    } finally {
      setSendingAdmin(false);
    }
  };

  const handleSendUserHostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newUserHostMessage.trim() ||
      !userHostSelectedConversation ||
      sendingUserHost
    )
      return;

    const recipientId = userHostSelectedConversation.userId;

    try {
      setSendingUserHost(true);
      await sendUserHostMessage(newUserHostMessage.trim(), recipientId);
      setNewUserHostMessage("");
    } catch (error) {
      console.error("Failed to send user-host message:", error);
    } finally {
      setSendingUserHost(false);
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

  const getUserHostConversationTitle = (conversation: any) => {
    return conversation.user?.name || "User";
  };

  const getUserHostConversationAvatar = (conversation: any) => {
    return conversation.user?.avatar;
  };

  const getLastMessage = (conversation: any) => {
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

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow h-[calc(100vh-120px)]">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 border-r bg-gray-50 flex flex-col">
            <div className="p-4 border-b">
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Messages
                {(adminConnected || userHostConnected) && (
                  <div className="ml-2 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    <span className="text-xs text-green-600">Live</span>
                  </div>
                )}
              </h1>
            </div>

            {user.role === "HOST" ? (
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col"
              >
                <div className="px-4 pt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="users" className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      Customers
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="flex items-center">
                      <Shield className="w-4 h-4 mr-1" />
                      Admin
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="users" className="flex-1 mt-0 p-0">
                  <div className="flex-1 overflow-y-auto">
                    {userHostLoading && userHostConversations.length === 0 ? (
                      <ConversationSkeleton />
                    ) : userHostConversations.length === 0 ? (
                      <div className="p-4">
                        <div className="text-center text-gray-500 py-8">
                          <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm">
                            No conversations with customers yet.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2">
                        {userHostConversations.map((conversation) => {
                          const lastMessage = getLastMessage(conversation);
                          const title =
                            getUserHostConversationTitle(conversation);
                          const avatar =
                            getUserHostConversationAvatar(conversation);
                          const isSelected =
                            userHostSelectedConversation?.id ===
                            conversation.id;

                          return (
                            <div
                              key={conversation.id}
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-blue-50 border border-blue-200"
                                  : "hover:bg-gray-100"
                              }`}
                              onClick={() =>
                                setUserHostSelectedConversation(conversation)
                              }
                            >
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarImage src={avatar || undefined} />
                                  <AvatarFallback>
                                    {getInitials(title)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {title}
                                    </p>
                                    {lastMessage && (
                                      <span className="text-xs text-gray-500">
                                        {formatDistanceToNow(
                                          new Date(lastMessage.createdAt),
                                          {
                                            addSuffix: true,
                                          }
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  {lastMessage && (
                                    <p className="text-sm text-gray-500 truncate">
                                      {lastMessage.senderId === user?.id
                                        ? "You: "
                                        : ""}
                                      {lastMessage.content}
                                    </p>
                                  )}
                                  {conversation._count?.messages > 0 && (
                                    <Badge
                                      variant="secondary"
                                      className="mt-1 text-xs"
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
                </TabsContent>

                <TabsContent value="admin" className="flex-1 mt-0 p-0">
                  <div className="flex-1 overflow-y-auto">
                    {adminLoading && adminConversations.length === 0 ? (
                      <ConversationSkeleton />
                    ) : adminConversations.length === 0 ? (
                      <div className="p-4">
                        {adminId ? (
                          <StartConversation
                            adminId={adminId}
                            onMessageSent={() => {
                              fetchAdminConversations();
                            }}
                          />
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            <Shield className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm">
                              Loading admin information...
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2">
                        {adminConversations.map((conversation) => {
                          const lastMessage = getLastMessage(conversation);
                          const title = getConversationTitle(conversation);
                          const avatar = getConversationAvatar(conversation);
                          const isSelected =
                            adminSelectedConversation?.id === conversation.id;

                          return (
                            <div
                              key={conversation.id}
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-blue-50 border border-blue-200"
                                  : "hover:bg-gray-100"
                              }`}
                              onClick={() =>
                                setAdminSelectedConversation(conversation)
                              }
                            >
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarImage src={avatar || undefined} />
                                  <AvatarFallback>
                                    {getInitials(title)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {title}
                                    </p>
                                    {lastMessage && (
                                      <span className="text-xs text-gray-500">
                                        {formatDistanceToNow(
                                          new Date(lastMessage.createdAt),
                                          {
                                            addSuffix: true,
                                          }
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  {lastMessage && (
                                    <p className="text-sm text-gray-500 truncate">
                                      {lastMessage.senderId === user?.id
                                        ? "You: "
                                        : ""}
                                      {lastMessage.content}
                                    </p>
                                  )}
                                  {conversation._count?.messages > 0 && (
                                    <Badge
                                      variant="secondary"
                                      className="mt-1 text-xs"
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
                </TabsContent>
              </Tabs>
            ) : (
              // Admin view - only admin conversations
              <div className="flex-1 overflow-y-auto">
                {adminLoading && adminConversations.length === 0 ? (
                  <ConversationSkeleton />
                ) : adminConversations.length === 0 ? (
                  <div className="p-4">
                    <div className="text-center text-gray-500 py-8">
                      <Shield className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm">
                        No conversations with hosts yet.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-2">
                    {adminConversations.map((conversation) => {
                      const lastMessage = getLastMessage(conversation);
                      const title = getConversationTitle(conversation);
                      const avatar = getConversationAvatar(conversation);
                      const isSelected =
                        adminSelectedConversation?.id === conversation.id;

                      return (
                        <div
                          key={conversation.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-blue-50 border border-blue-200"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() =>
                            setAdminSelectedConversation(conversation)
                          }
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={avatar || undefined} />
                              <AvatarFallback>
                                {getInitials(title)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {title}
                                </p>
                                {lastMessage && (
                                  <span className="text-xs text-gray-500">
                                    {formatDistanceToNow(
                                      new Date(lastMessage.createdAt),
                                      {
                                        addSuffix: true,
                                      }
                                    )}
                                  </span>
                                )}
                              </div>
                              {lastMessage && (
                                <p className="text-sm text-gray-500 truncate">
                                  {lastMessage.senderId === user?.id
                                    ? "You: "
                                    : ""}
                                  {lastMessage.content}
                                </p>
                              )}
                              {conversation._count?.messages > 0 && (
                                <Badge
                                  variant="secondary"
                                  className="mt-1 text-xs"
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
            )}
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {(activeTab === "users" && userHostSelectedConversation) ||
            (activeTab === "admin" && adminSelectedConversation) ||
            (user.role === "ADMIN" && adminSelectedConversation) ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b bg-white">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage
                        src={
                          activeTab === "users" && userHostSelectedConversation
                            ? getUserHostConversationAvatar(
                                userHostSelectedConversation
                              )
                            : adminSelectedConversation
                            ? getConversationAvatar(adminSelectedConversation)
                            : undefined
                        }
                      />
                      <AvatarFallback>
                        {activeTab === "users" && userHostSelectedConversation
                          ? getInitials(
                              getUserHostConversationTitle(
                                userHostSelectedConversation
                              )
                            )
                          : adminSelectedConversation
                          ? getInitials(
                              getConversationTitle(adminSelectedConversation)
                            )
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {activeTab === "users" && userHostSelectedConversation
                          ? getUserHostConversationTitle(
                              userHostSelectedConversation
                            )
                          : adminSelectedConversation
                          ? getConversationTitle(adminSelectedConversation)
                          : "Unknown"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {activeTab === "users"
                          ? "Customer"
                          : user?.role === "HOST"
                          ? "Admin"
                          : "Host"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {((activeTab === "users" && userHostLoading) ||
                    (activeTab === "admin" && adminLoading)) &&
                  ((activeTab === "users" && userHostMessages.length === 0) ||
                    (activeTab === "admin" && adminMessages.length === 0)) ? (
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
                  ) : (activeTab === "users" &&
                      userHostMessages.length === 0) ||
                    (activeTab === "admin" && adminMessages.length === 0) ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    (activeTab === "users"
                      ? userHostMessages
                      : adminMessages
                    ).map((message) => {
                      const isOwn = message.senderId === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isOwn ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
                            {!isOwn && (
                              <Avatar className="w-6 h-6">
                                <AvatarImage
                                  src={message.sender?.avatar || undefined}
                                />
                                <AvatarFallback className="text-xs">
                                  {getInitials(message.sender?.name || "U")}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                isOwn
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
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
                                <AvatarFallback className="text-xs">
                                  {getInitials(user?.name || "U")}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div
                    ref={
                      activeTab === "users"
                        ? userHostMessagesEndRef
                        : adminMessagesEndRef
                    }
                  />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t bg-white">
                  <form
                    onSubmit={
                      activeTab === "users"
                        ? handleSendUserHostMessage
                        : handleSendAdminMessage
                    }
                    className="flex space-x-2"
                  >
                    <Input
                      value={
                        activeTab === "users"
                          ? newUserHostMessage
                          : newAdminMessage
                      }
                      onChange={(e) =>
                        activeTab === "users"
                          ? setNewUserHostMessage(e.target.value)
                          : setNewAdminMessage(e.target.value)
                      }
                      placeholder="Type your message..."
                      disabled={
                        activeTab === "users" ? sendingUserHost : sendingAdmin
                      }
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={
                        activeTab === "users"
                          ? !newUserHostMessage.trim() || sendingUserHost
                          : !newAdminMessage.trim() || sendingAdmin
                      }
                    >
                      {(
                        activeTab === "users" ? sendingUserHost : sendingAdmin
                      ) ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Welcome to Messages
                  </h3>
                  <p className="text-sm">
                    Select a conversation from the sidebar to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {(adminError || userHostError) && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
            {adminError || userHostError}
          </div>
        )}
      </div>
    </div>
  );
}
