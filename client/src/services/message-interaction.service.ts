import { Message, MessageReaction, MessageReply, MessageThread } from '../types/message';
import { errorService } from './error.service';

class MessageInteractionService {
  private static instance: MessageInteractionService;

  private constructor() {}

  static getInstance(): MessageInteractionService {
    if (!MessageInteractionService.instance) {
      MessageInteractionService.instance = new MessageInteractionService();
    }
    return MessageInteractionService.instance;
  }

  async addReaction(messageId: string, emoji: string): Promise<MessageReaction> {
    try {
      const reaction: MessageReaction = {
        id: crypto.randomUUID(),
        emoji,
        userId: 'current-user-id', // Replace with actual user ID
        timestamp: Date.now(),
      };

      // Implement server sync
      this.broadcastReactionUpdate(messageId, reaction, 'add');
      return reaction;
    } catch (error) {
      errorService.handleError(error, 'ADD_REACTION_FAILED', 'low');
      throw error;
    }
  }

  async removeReaction(messageId: string, reactionId: string): Promise<void> {
    try {
      // Implement server sync
      this.broadcastReactionUpdate(messageId, { id: reactionId } as MessageReaction, 'remove');
    } catch (error) {
      errorService.handleError(error, 'REMOVE_REACTION_FAILED', 'low');
      throw error;
    }
  }

  async createReply(parentMessageId: string, content: string): Promise<MessageReply> {
    try {
      const reply: MessageReply = {
        id: crypto.randomUUID(),
        content,
        userId: 'current-user-id', // Replace with actual user ID
        timestamp: Date.now(),
        parentId: parentMessageId,
      };

      // Implement server sync
      this.broadcastReplyUpdate(parentMessageId, reply, 'add');
      return reply;
    } catch (error) {
      errorService.handleError(error, 'CREATE_REPLY_FAILED', 'medium');
      throw error;
    }
  }

  async createThread(messageId: string): Promise<MessageThread> {
    try {
      const thread: MessageThread = {
        id: crypto.randomUUID(),
        parentMessageId: messageId,
        participantIds: ['current-user-id'], // Replace with actual user ID
        lastReplyAt: Date.now(),
        replyCount: 0,
      };

      // Implement server sync
      this.broadcastThreadUpdate(thread);
      return thread;
    } catch (error) {
      errorService.handleError(error, 'CREATE_THREAD_FAILED', 'medium');
      throw error;
    }
  }

  async getMessageThread(threadId: string): Promise<Message[]> {
    try {
      // Implement server fetch
      return [];
    } catch (error) {
      errorService.handleError(error, 'GET_THREAD_FAILED', 'medium');
      throw error;
    }
  }

  private broadcastReactionUpdate(
    messageId: string,
    reaction: MessageReaction,
    action: 'add' | 'remove'
  ): void {
    window.dispatchEvent(
      new CustomEvent('wspr:reaction:update', {
        detail: { messageId, reaction, action },
      })
    );
  }

  private broadcastReplyUpdate(
    parentMessageId: string,
    reply: MessageReply,
    action: 'add' | 'remove'
  ): void {
    window.dispatchEvent(
      new CustomEvent('wspr:reply:update', {
        detail: { parentMessageId, reply, action },
      })
    );
  }

  private broadcastThreadUpdate(thread: MessageThread): void {
    window.dispatchEvent(
      new CustomEvent('wspr:thread:update', {
        detail: { thread },
      })
    );
  }
}

export const messageInteractionService = MessageInteractionService.getInstance();
