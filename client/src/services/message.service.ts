import { io, Socket } from 'socket.io-client';
import cryptoService, { EncryptedMessage } from './crypto.service';

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
}

export interface EncryptedMessagePayload {
  id: string;
  senderId: string;
  recipientId: string;
  content: EncryptedMessage;
  timestamp: number;
}

class MessageService {
  private socket: Socket | null = null;
  private messageCallbacks: ((message: Message) => void)[] = [];
  private statusCallbacks: ((messageId: string, status: Message['status']) => void)[] = [];

  /**
   * Initialize the message service
   * @param token JWT token for authentication
   */
  initialize(token: string): void {
    this.socket = io(process.env.VITE_WS_URL || 'ws://localhost:3001', {
      auth: { token },
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Handle incoming encrypted messages
    this.socket.on('message:received', async (payload: EncryptedMessagePayload) => {
      try {
        // Decrypt the message
        const content = await cryptoService.decryptMessage(
          payload.senderId,
          payload.content
        );

        // Create the decrypted message object
        const message: Message = {
          id: payload.id,
          senderId: payload.senderId,
          recipientId: payload.recipientId,
          content,
          timestamp: payload.timestamp,
          status: 'delivered',
        };

        // Notify the sender that we received the message
        this.socket?.emit('message:status', {
          messageId: message.id,
          status: 'delivered',
        });

        // Notify subscribers
        this.messageCallbacks.forEach((callback) => callback(message));
      } catch (error) {
        console.error('Failed to decrypt message:', error);
      }
    });

    // Handle message status updates
    this.socket.on(
      'message:status',
      ({ messageId, status }: { messageId: string; status: Message['status'] }) => {
        this.statusCallbacks.forEach((callback) => callback(messageId, status));
      }
    );
  }

  /**
   * Send a message to another user
   * @param recipientId The ID of the recipient
   * @param content The message content
   */
  async sendMessage(recipientId: string, content: string): Promise<string> {
    if (!this.socket) {
      throw new Error('Message service not initialized');
    }

    // Ensure we have a secure session with the recipient
    if (!cryptoService.hasSecureSession(recipientId)) {
      throw new Error('No secure session established with recipient');
    }

    // Encrypt the message
    const encryptedContent = await cryptoService.encryptMessage(recipientId, content);

    // Generate a message ID
    const messageId = crypto.randomUUID();

    // Create the message payload
    const payload: EncryptedMessagePayload = {
      id: messageId,
      senderId: this.socket.id,
      recipientId,
      content: encryptedContent,
      timestamp: Date.now(),
    };

    // Send the encrypted message
    this.socket.emit('message:send', payload);

    return messageId;
  }

  /**
   * Mark a message as read
   * @param messageId The ID of the message
   */
  markAsRead(messageId: string): void {
    if (!this.socket) {
      throw new Error('Message service not initialized');
    }

    this.socket.emit('message:status', {
      messageId,
      status: 'read',
    });
  }

  /**
   * Subscribe to new messages
   * @param callback Function to call when a new message is received
   */
  onMessage(callback: (message: Message) => void): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Subscribe to message status updates
   * @param callback Function to call when a message status changes
   */
  onMessageStatus(
    callback: (messageId: string, status: Message['status']) => void
  ): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Disconnect from the messaging service
   */
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.messageCallbacks = [];
    this.statusCallbacks = [];
  }
}

export const messageService = new MessageService();
export default messageService;
