import { Request, Response } from 'express';
import scheduledMessageService from '../services/scheduled-message.service';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

// Validation schemas
const recurringPatternSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().min(1).optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  monthOfYear: z.number().min(1).max(12).optional(),
  endDate: z.string().datetime().optional(),
  maxOccurrences: z.number().min(1).optional()
});

const createScheduledMessageSchema = z.object({
  threadId: z.string().uuid(),
  content: z.string().min(1),
  scheduledFor: z.string().datetime(),
  recurring: z.boolean().optional(),
  recurringPattern: recurringPatternSchema.optional()
});

const updateScheduledMessageSchema = z.object({
  content: z.string().min(1).optional(),
  scheduledFor: z.string().datetime().optional(),
  recurring: z.boolean().optional(),
  recurringPattern: recurringPatternSchema.optional()
});

export class ScheduledMessageController {
  /**
   * Create a new scheduled message
   */
  static async createScheduledMessage(req: Request, res: Response) {
    try {
      const {
        threadId,
        content,
        scheduledFor,
        recurring,
        recurringPattern
      } = validateRequest(req.body, createScheduledMessageSchema);

      const userId = req.user!.id;

      const message = await scheduledMessageService.createScheduledMessage(
        userId,
        threadId,
        content,
        new Date(scheduledFor),
        recurring,
        recurringPattern
      );

      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get scheduled messages for the current user
   */
  static async getScheduledMessages(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { threadId, status, startDate, endDate } = req.query;

      const messages = await scheduledMessageService.getScheduledMessages(userId, {
        threadId: threadId as string,
        status: status as any,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });

      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update a scheduled message
   */
  static async updateScheduledMessage(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      const userId = req.user!.id;
      const updates = validateRequest(req.body, updateScheduledMessageSchema);

      // Convert scheduledFor to Date if present
      if (updates.scheduledFor) {
        updates.scheduledFor = new Date(updates.scheduledFor);
      }

      const message = await scheduledMessageService.updateScheduledMessage(
        messageId,
        userId,
        updates
      );

      res.json(message);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Cancel a scheduled message
   */
  static async cancelScheduledMessage(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      const userId = req.user!.id;

      await scheduledMessageService.cancelScheduledMessage(messageId, userId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
