import { io, Socket } from 'socket.io-client';

export interface UserPresence {
  userId: string;
  status: 'online' | 'offline';
  lastSeen?: number;
  isTyping?: boolean;
}

type PresenceCallback = (presence: UserPresence) => void;
type TypingCallback = (userId: string, isTyping: boolean) => void;

class PresenceService {
  private socket: Socket | null = null;
  private presenceCallbacks: Map<string, PresenceCallback[]> = new Map();
  private typingCallbacks: Map<string, TypingCallback[]> = new Map();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Initialize the presence service
   */
  initialize(token: string): void {
    this.socket = io(process.env.VITE_WS_URL || 'ws://localhost:3001', {
      auth: { token },
      path: '/presence',
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('presence:update', (presence: UserPresence) => {
      const callbacks = this.presenceCallbacks.get(presence.userId) || [];
      callbacks.forEach((callback) => callback(presence));
    });

    this.socket.on(
      'user:typing',
      ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
        const callbacks = this.typingCallbacks.get(userId) || [];
        callbacks.forEach((callback) => callback(userId, isTyping));
      }
    );
  }

  /**
   * Subscribe to user presence updates
   */
  subscribeToPresence(userId: string, callback: PresenceCallback): () => void {
    if (!this.presenceCallbacks.has(userId)) {
      this.presenceCallbacks.set(userId, []);
      this.socket?.emit('presence:subscribe', { userId });
    }

    const callbacks = this.presenceCallbacks.get(userId)!;
    callbacks.push(callback);

    return () => {
      const updatedCallbacks = callbacks.filter((cb) => cb !== callback);
      if (updatedCallbacks.length === 0) {
        this.presenceCallbacks.delete(userId);
        this.socket?.emit('presence:unsubscribe', { userId });
      } else {
        this.presenceCallbacks.set(userId, updatedCallbacks);
      }
    };
  }

  /**
   * Subscribe to typing indicators
   */
  subscribeToTyping(userId: string, callback: TypingCallback): () => void {
    if (!this.typingCallbacks.has(userId)) {
      this.typingCallbacks.set(userId, []);
    }

    const callbacks = this.typingCallbacks.get(userId)!;
    callbacks.push(callback);

    return () => {
      const updatedCallbacks = callbacks.filter((cb) => cb !== callback);
      if (updatedCallbacks.length === 0) {
        this.typingCallbacks.delete(userId);
      } else {
        this.typingCallbacks.set(userId, updatedCallbacks);
      }
    };
  }

  /**
   * Update typing status
   */
  updateTypingStatus(recipientId: string, isTyping: boolean): void {
    if (!this.socket) return;

    // Clear existing timeout
    const existingTimeout = this.typingTimeouts.get(recipientId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Send typing status
    this.socket.emit('user:typing', {
      recipientId,
      isTyping,
    });

    // Automatically clear typing status after 5 seconds
    if (isTyping) {
      const timeout = setTimeout(() => {
        this.updateTypingStatus(recipientId, false);
      }, 5000);
      this.typingTimeouts.set(recipientId, timeout);
    } else {
      this.typingTimeouts.delete(recipientId);
    }
  }

  /**
   * Get current presence status
   */
  async getCurrentPresence(userId: string): Promise<UserPresence> {
    if (!this.socket) {
      throw new Error('Presence service not initialized');
    }

    return new Promise((resolve) => {
      this.socket!.emit('presence:get', { userId }, (presence: UserPresence) => {
        resolve(presence);
      });
    });
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.presenceCallbacks.clear();
    this.typingCallbacks.clear();
    this.typingTimeouts.forEach(clearTimeout);
    this.typingTimeouts.clear();
  }
}

export const presenceService = new PresenceService();
export default presenceService;
