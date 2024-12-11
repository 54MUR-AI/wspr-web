export interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  timestamp: number;
  threadId?: string;
  replyToId?: string;
  editHistory?: MessageEdit[];
  isPinned?: boolean;
  isBookmarked?: boolean;
  isPriority?: boolean;
  scheduledFor?: number;
  tags?: string[];
  attachments?: MessageAttachment[];
  metadata?: MessageMetadata;
  status?: MessageDeliveryStatus;
}

export interface MessageEdit {
  content: string;
  timestamp: number;
  editorId: string;
}

export interface MessageAttachment {
  id: string;
  type: string;
  url: string;
  name: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

export interface MessageMetadata {
  clientId?: string;
  encryptionVersion?: string;
  iv?: string;
  signature?: string;
  deviceInfo?: {
    type: string;
    os: string;
    browser: string;
    version: string;
  };
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  userId: string;
}

export interface MessageSearchFilters {
  query?: string;
  senderId?: string;
  recipientId?: string;
  threadId?: string;
  startDate?: number;
  endDate?: number;
  isPinned?: boolean;
  isBookmarked?: boolean;
  hasAttachments?: boolean;
  tags?: string[];
}

export interface MessageThread {
  id: string;
  title?: string;
  participants: string[];
  createdAt: number;
  updatedAt: number;
  lastMessageId?: string;
  messageCount: number;
  isPinned?: boolean;
  metadata?: Record<string, any>;
}

export interface MessageReply {
  id: string;
  threadId: string;
  replyToId: string;
  content: string;
  senderId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface MessageReaction {
  messageId: string;
  userId: string;
  reaction: string;
  timestamp: number;
}

export interface MessageDeliveryInfo {
  messageId: string;
  recipientId: string;
  deliveredAt?: number;
  readAt?: number;
  error?: string;
  retryCount?: number;
  metadata?: Record<string, any>;
}

export type MessageDeliveryStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageStatus {
  messageId: string;
  status: MessageDeliveryStatus;
  timestamp: string;
  userId: string;
}

export interface TypingStatus {
  userId: string;
  recipientId: string;
  isTyping: boolean;
  timestamp: string;
}
