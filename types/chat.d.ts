export interface ChatAttachment {
  type: string;
  url: string;
  name: string;
  size: number;
  publicId: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  isRead: boolean;
  attachments?: ChatAttachment[];
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
}

export interface ChatConversation {
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
  messages?: ChatMessage[];
  _count?: {
    messages: number;
  };
}
