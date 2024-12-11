export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: string;
  bio?: string;
  preferences?: UserPreferences;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    email: boolean;
  };
  privacy?: {
    showLastSeen: boolean;
    showReadReceipts: boolean;
    showTypingIndicator: boolean;
  };
  language?: string;
  timezone?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  deviceInfo: {
    type: string;
    os: string;
    browser: string;
    version: string;
  };
  ipAddress: string;
  lastActive: string;
  createdAt: string;
}

export interface UserCredentials {
  id: string;
  userId: string;
  type: 'password' | 'webauthn' | 'recovery';
  credentialId?: string;
  publicKey?: string;
  lastUsed?: string;
  createdAt: string;
}

export interface UserContact {
  id: string;
  userId: string;
  contactId: string;
  nickname?: string;
  blocked: boolean;
  muted: boolean;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
