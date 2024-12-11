import { Op } from 'sequelize';
import { ScheduledMessage, RecurringPattern } from '../models/ScheduledMessage';
import { MessageThread } from '../models/MessageThread';
import { User } from '../models/User';
import messageService from './message.service';

class ScheduledMessageService {
  private static instance: ScheduledMessageService;

  private constructor() {
    // Initialize scheduler
    this.startScheduler();
  }

  public static getInstance(): ScheduledMessageService {
    if (!ScheduledMessageService.instance) {
      ScheduledMessageService.instance = new ScheduledMessageService();
    }
    return ScheduledMessageService.instance;
  }

  /**
   * Create a new scheduled message
   */
  async createScheduledMessage(
    userId: string,
    threadId: string,
    content: string,
    scheduledFor: Date,
    recurring = false,
    recurringPattern?: RecurringPattern
  ): Promise<ScheduledMessage> {
    const message = await ScheduledMessage.create({
      userId,
      threadId,
      content,
      scheduledFor,
      recurring,
      recurringPattern,
      nextOccurrence: recurring ? scheduledFor : undefined
    });

    return message;
  }

  /**
   * Get scheduled messages for a user
   */
  async getScheduledMessages(
    userId: string,
    options: {
      threadId?: string;
      status?: 'pending' | 'sent' | 'failed' | 'cancelled';
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<ScheduledMessage[]> {
    const { threadId, status, startDate, endDate } = options;
    const whereClause: any = { userId };

    if (threadId) {
      whereClause.threadId = threadId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (startDate || endDate) {
      whereClause.scheduledFor = {};
      if (startDate) {
        whereClause.scheduledFor[Op.gte] = startDate;
      }
      if (endDate) {
        whereClause.scheduledFor[Op.lte] = endDate;
      }
    }

    return await ScheduledMessage.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        },
        {
          model: MessageThread,
          as: 'thread'
        }
      ],
      order: [['scheduledFor', 'ASC']]
    });
  }

  /**
   * Update a scheduled message
   */
  async updateScheduledMessage(
    messageId: string,
    userId: string,
    updates: Partial<ScheduledMessage>
  ): Promise<ScheduledMessage> {
    const message = await ScheduledMessage.findOne({
      where: { id: messageId, userId }
    });

    if (!message) {
      throw new Error('Scheduled message not found or unauthorized');
    }

    // If updating recurring pattern, recalculate next occurrence
    if (updates.recurringPattern || updates.scheduledFor) {
      const nextOccurrence = message.calculateNextOccurrence();
      updates.nextOccurrence = nextOccurrence || undefined;
    }

    await message.update(updates);
    return message;
  }

  /**
   * Cancel a scheduled message
   */
  async cancelScheduledMessage(messageId: string, userId: string): Promise<void> {
    const message = await ScheduledMessage.findOne({
      where: { id: messageId, userId }
    });

    if (!message) {
      throw new Error('Scheduled message not found or unauthorized');
    }

    await message.update({ status: 'cancelled' });
  }

  /**
   * Process scheduled messages
   */
  private async processScheduledMessages(): Promise<void> {
    try {
      // Find all pending messages that are due
      const dueMessages = await ScheduledMessage.findAll({
        where: {
          status: 'pending',
          scheduledFor: {
            [Op.lte]: new Date()
          }
        },
        include: [
          {
            model: MessageThread,
            as: 'thread'
          }
        ]
      });

      for (const message of dueMessages) {
        try {
          // Send the message
          await messageService.sendMessage(
            message.userId,
            message.threadId,
            message.content
          );

          // Update message status
          await message.update({ status: 'sent' });

          // If recurring, calculate and set next occurrence
          if (message.recurring) {
            const nextOccurrence = message.calculateNextOccurrence();
            if (nextOccurrence) {
              await this.createScheduledMessage(
                message.userId,
                message.threadId,
                message.content,
                nextOccurrence,
                true,
                message.recurringPattern
              );
            }
          }
        } catch (error) {
          await message.update({
            status: 'failed',
            metadata: {
              ...message.metadata,
              error: error.message
            }
          });
        }
      }
    } catch (error) {
      console.error('Error processing scheduled messages:', error);
    }
  }

  /**
   * Start the scheduler
   */
  private startScheduler(): void {
    // Process messages every minute
    setInterval(() => {
      this.processScheduledMessages();
    }, 60000);
  }
}

export default ScheduledMessageService.getInstance();
