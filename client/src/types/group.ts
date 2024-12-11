export interface GroupKeys {
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}

export interface GroupMember {
  id: string;
  publicKey: JsonWebKey;
  role: GroupRole;
  joinedAt: Date;
  lastActive: Date;
}

export interface EncryptedMessage {
  encryptedData: number[];
  iv: number[];
}

export enum GroupRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER'
}

export interface GroupMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  lastKeyRotation: Date;
  memberCount: number;
  maxMembers: number;
  encryptionVersion: string;
}

export interface GroupPermissions {
  canInvite: boolean;
  canRemoveMembers: boolean;
  canEditSettings: boolean;
  canRotateKeys: boolean;
  canDeleteGroup: boolean;
  canViewHistory: boolean;
}

export interface GroupMessage {
  id: string;
  senderId: string;
  encryptedContent: EncryptedMessage;
  timestamp: Date;
  type: MessageType;
  replyTo?: string;
  attachments?: EncryptedAttachment[];
  metadata: MessageMetadata;
}

export interface EncryptedAttachment {
  id: string;
  encryptedData: number[];
  iv: number[];
  filename: string;
  mimeType: string;
  size: number;
}

export interface MessageMetadata {
  edited: boolean;
  editedAt?: Date;
  readBy: string[];
  deliveredTo: string[];
  reactions: MessageReaction[];
}

export interface MessageReaction {
  emoji: string;
  users: string[];
}

export enum MessageType {
  TEXT = 'TEXT',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
  KEY_ROTATION = 'KEY_ROTATION'
}
