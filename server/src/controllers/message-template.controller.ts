import { Request, Response } from 'express';
import messageTemplateService from '../services/message-template.service';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

// Validation schemas
const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  content: z.string().min(1),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  content: z.string().min(1).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export class MessageTemplateController {
  /**
   * Create a new message template
   */
  static async createTemplate(req: Request, res: Response) {
    try {
      const { name, content, category, tags } = validateRequest(req.body, createTemplateSchema);
      const userId = req.user!.id;

      const template = await messageTemplateService.createTemplate(
        userId,
        name,
        content,
        category,
        tags
      );

      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get templates for the current user
   */
  static async getTemplates(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { category, tags, includeShared } = req.query;

      const templates = await messageTemplateService.getTemplates(userId, {
        category: category as string,
        tags: tags ? (tags as string).split(',') : undefined,
        includeShared: includeShared === 'true'
      });

      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Search templates
   */
  static async searchTemplates(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { query, includeShared } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      const templates = await messageTemplateService.searchTemplates(
        query,
        userId,
        includeShared === 'true'
      );

      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update a template
   */
  static async updateTemplate(req: Request, res: Response) {
    try {
      const { templateId } = req.params;
      const userId = req.user!.id;
      const updates = validateRequest(req.body, updateTemplateSchema);

      const template = await messageTemplateService.updateTemplate(
        templateId,
        userId,
        updates
      );

      res.json(template);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Delete a template
   */
  static async deleteTemplate(req: Request, res: Response) {
    try {
      const { templateId } = req.params;
      const userId = req.user!.id;

      await messageTemplateService.deleteTemplate(templateId, userId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Toggle template sharing
   */
  static async toggleSharing(req: Request, res: Response) {
    try {
      const { templateId } = req.params;
      const userId = req.user!.id;
      const { shared } = req.body;

      if (typeof shared !== 'boolean') {
        return res.status(400).json({ error: 'shared parameter must be a boolean' });
      }

      const template = await messageTemplateService.toggleTemplateSharing(
        templateId,
        userId,
        shared
      );

      res.json(template);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
