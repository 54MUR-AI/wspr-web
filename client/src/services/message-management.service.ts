import { Message, MessageEdit } from '../types/message';
import { encryptMessage, decryptMessage } from './crypto.service';
import { ErrorService } from './error.service';
import { WebSocketService } from './websocket.service';

export class MessageManagementService {
  private static instance: MessageManagementService;
  private ws: WebSocketService;
  private errorService: ErrorService;

  private constructor() {
    this.ws = WebSocketService.getInstance();
    this.errorService = ErrorService.getInstance();
  }

  public static getInstance(): MessageManagementService {
    if (!MessageManagementService.instance) {
      MessageManagementService.instance = new MessageManagementService();
    }
    return MessageManagementService.instance;
  }

  /**
   * Edit a message
   */
  public async editMessage(messageId: string, newContent: string): Promise<Message> {
    try {
      // Encrypt the new content
      const encryptedContent = await encryptMessage(newContent);
      
      // Create edit history entry
      const edit: MessageEdit = {
        timestamp: Date.now(),
        content: encryptedContent,
        userId: this.ws.getCurrentUserId()
      };

      // Send edit request
      const response = await this.ws.send('message:edit', {
        messageId,
        content: encryptedContent,
        edit
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Decrypt the updated message
      const decryptedMessage = await decryptMessage(response.message);
      return decryptedMessage;
    } catch (error) {
      this.errorService.handleError(error, 'Failed to edit message');
      throw error;
    }
  }

  /**
   * Delete a message
   */
  public async deleteMessage(messageId: string, deletionType: 'self' | 'all' = 'all'): Promise<void> {
    try {
      const response = await this.ws.send('message:delete', {
        messageId,
        deletionType,
        timestamp: Date.now(),
        userId: this.ws.getCurrentUserId()
      });

      if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      this.errorService.handleError(error, 'Failed to delete message');
      throw error;
    }
  }

  /**
   * Pin a message
   */
  public async pinMessage(messageId: string): Promise<Message> {
    try {
      const response = await this.ws.send('message:pin', {
        messageId,
        timestamp: Date.now(),
        userId: this.ws.getCurrentUserId()
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return await decryptMessage(response.message);
    } catch (error) {
      this.errorService.handleError(error, 'Failed to pin message');
      throw error;
    }
  }

  /**
   * Unpin a message
   */
  public async unpinMessage(messageId: string): Promise<Message> {
    try {
      const response = await this.ws.send('message:unpin', {
        messageId,
        timestamp: Date.now(),
        userId: this.ws.getCurrentUserId()
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return await decryptMessage(response.message);
    } catch (error) {
      this.errorService.handleError(error, 'Failed to unpin message');
      throw error;
    }
  }

  /**
   * Schedule a message
   */
  public async scheduleMessage(content: string, scheduledFor: number): Promise<Message> {
    try {
      const encryptedContent = await encryptMessage(content);
      
      const response = await this.ws.send('message:schedule', {
        content: encryptedContent,
        scheduledFor,
        userId: this.ws.getCurrentUserId(),
        timestamp: Date.now()
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return await decryptMessage(response.message);
    } catch (error) {
      this.errorService.handleError(error, 'Failed to schedule message');
      throw error;
    }
  }

  /**
   * Cancel a scheduled message
   */
  public async cancelScheduledMessage(messageId: string): Promise<void> {
    try {
      const response = await this.ws.send('message:cancelScheduled', {
        messageId,
        userId: this.ws.getCurrentUserId()
      });

      if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      this.errorService.handleError(error, 'Failed to cancel scheduled message');
      throw error;
    }
  }

  /**
   * Bookmark a message
   */
  public async bookmarkMessage(messageId: string): Promise<Message> {
    try {
      const response = await this.ws.send('message:bookmark', {
        messageId,
        userId: this.ws.getCurrentUserId(),
        timestamp: Date.now()
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return await decryptMessage(response.message);
    } catch (error) {
      this.errorService.handleError(error, 'Failed to bookmark message');
      throw error;
    }
  }

  /**
   * Remove a bookmark
   */
  public async removeBookmark(messageId: string): Promise<Message> {
    try {
      const response = await this.ws.send('message:removeBookmark', {
        messageId,
        userId: this.ws.getCurrentUserId(),
        timestamp: Date.now()
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return await decryptMessage(response.message);
    } catch (error) {
      this.errorService.handleError(error, 'Failed to remove bookmark');
      throw error;
    }
  }
}
