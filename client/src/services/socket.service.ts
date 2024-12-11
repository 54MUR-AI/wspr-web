import { io, Socket } from 'socket.io-client';
import { Message, MessageStatus, TypingStatus } from '../types/message';
import AuthService from './auth.service';
import { encryptMessage, decryptMessage } from '../utils/encryption';

const SOCKET_URL = process.env.VITE_WS_URL || 'ws://localhost:3001';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private messageHandlers: Set<(message: Message) => void> = new Set();
  private statusHandlers: Set<(status: MessageStatus) => void> = new Set();
  private typingHandlers: Set<(status: TypingStatus) => void> = new Set();
  private presenceHandlers: Set<(userId: string, status: 'online' | 'offline') => void> = new Set();

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = AuthService.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        this.socket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.setupEventListeners();
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          reject(error);
        });
      } catch (error) {
        console.error('Socket initialization error:', error);
        reject(error);
      }
    });
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Message events
    this.socket.on('message:new', async (encryptedMessage: string) => {
      try {
        const decryptedMessage = await decryptMessage(encryptedMessage);
        this.messageHandlers.forEach(handler => handler(decryptedMessage));
      } catch (error) {
        console.error('Error processing new message:', error);
      }
    });

    this.socket.on('message:status', (status: MessageStatus) => {
      this.statusHandlers.forEach(handler => handler(status));
    });

    // Typing indicators
    this.socket.on('typing:status', (status: TypingStatus) => {
      this.typingHandlers.forEach(handler => handler(status));
    });

    // Presence updates
    this.socket.on('presence:update', (userId: string, status: 'online' | 'offline') => {
      this.presenceHandlers.forEach(handler => handler(userId, status));
    });

    // Reconnection handling
    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on('reconnect_error', (error: Error) => {
      console.error('Reconnection error:', error);
    });
  }

  async sendMessage(message: Message): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    try {
      const encryptedMessage = await encryptMessage(message);
      this.socket.emit('message:send', encryptedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  updateMessageStatus(messageId: string, status: MessageStatus['status']): void {
    if (!this.socket?.connected) return;

    this.socket.emit('message:status:update', {
      messageId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  sendTypingStatus(recipientId: string, isTyping: boolean): void {
    if (!this.socket?.connected) return;

    this.socket.emit('typing:update', {
      recipientId,
      isTyping,
      timestamp: new Date().toISOString(),
    });
  }

  // Event listeners registration
  onMessage(handler: (message: Message) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onMessageStatus(handler: (status: MessageStatus) => void): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  onTypingStatus(handler: (status: TypingStatus) => void): () => void {
    this.typingHandlers.add(handler);
    return () => this.typingHandlers.delete(handler);
  }

  onPresenceUpdate(
    handler: (userId: string, status: 'online' | 'offline') => void
  ): () => void {
    this.presenceHandlers.add(handler);
    return () => this.presenceHandlers.delete(handler);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default SocketService.getInstance();
