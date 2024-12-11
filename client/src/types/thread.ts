import { Message } from './message';
import { User } from './user';

export interface ThreadParticipant extends User {
  role: 'owner' | 'admin' | 'member';
  lastReadMessageId: string | null;
  status: 'online' | 'offline';
  mutedUntil: string | null;
  isActive: boolean;
}

export interface Thread {
  id: string;
  title: string | null;
  type: 'direct' | 'group';
  lastMessage: Message | null;
  lastMessageId: string | null;
  participants: ThreadParticipant[];
  messageCount: number;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
