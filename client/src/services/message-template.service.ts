import { MessageTemplate } from '../types/message';
import { WebSocketService } from './websocket.service';
import { ErrorService } from './error.service';
import { encryptMessage, decryptMessage } from './crypto.service';

export class MessageTemplateService {
  private static instance: MessageTemplateService;
  private ws: WebSocketService;
  private errorService: ErrorService;

  private constructor() {
    this.ws = WebSocketService.getInstance();
    this.errorService = ErrorService.getInstance();
  }

  public static getInstance(): MessageTemplateService {
    if (!MessageTemplateService.instance) {
      MessageTemplateService.instance = new MessageTemplateService();
    }
    return MessageTemplateService.instance;
  }

  /**
   * Create a new message template
   */
  public async createTemplate(
    name: string,
    content: string,
    category?: string,
    tags?: string[]
  ): Promise<MessageTemplate> {
    try {
      const encryptedContent = await encryptMessage(content);
      
      const response = await this.ws.send('template:create', {
        name,
        content: encryptedContent,
        category,
        tags,
        userId: this.ws.getCurrentUserId(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const template = response.template;
      template.content = await decryptMessage(template.content);
      return template;
    } catch (error) {
      this.errorService.handleError(error, 'Failed to create template');
      throw error;
    }
  }

  /**
   * Get all templates for the current user
   */
  public async getTemplates(): Promise<MessageTemplate[]> {
    try {
      const response = await this.ws.send('template:list', {
        userId: this.ws.getCurrentUserId()
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const templates = await Promise.all(
        response.templates.map(async (template: MessageTemplate) => ({
          ...template,
          content: await decryptMessage(template.content)
        }))
      );

      return templates;
    } catch (error) {
      this.errorService.handleError(error, 'Failed to fetch templates');
      throw error;
    }
  }

  /**
   * Update an existing template
   */
  public async updateTemplate(
    templateId: string,
    updates: Partial<MessageTemplate>
  ): Promise<MessageTemplate> {
    try {
      const encryptedContent = updates.content 
        ? await encryptMessage(updates.content)
        : undefined;

      const response = await this.ws.send('template:update', {
        templateId,
        updates: {
          ...updates,
          content: encryptedContent,
          updatedAt: Date.now()
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const template = response.template;
      template.content = await decryptMessage(template.content);
      return template;
    } catch (error) {
      this.errorService.handleError(error, 'Failed to update template');
      throw error;
    }
  }

  /**
   * Delete a template
   */
  public async deleteTemplate(templateId: string): Promise<void> {
    try {
      const response = await this.ws.send('template:delete', {
        templateId,
        userId: this.ws.getCurrentUserId()
      });

      if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      this.errorService.handleError(error, 'Failed to delete template');
      throw error;
    }
  }

  /**
   * Get templates by category
   */
  public async getTemplatesByCategory(category: string): Promise<MessageTemplate[]> {
    try {
      const response = await this.ws.send('template:listByCategory', {
        category,
        userId: this.ws.getCurrentUserId()
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const templates = await Promise.all(
        response.templates.map(async (template: MessageTemplate) => ({
          ...template,
          content: await decryptMessage(template.content)
        }))
      );

      return templates;
    } catch (error) {
      this.errorService.handleError(error, 'Failed to fetch templates by category');
      throw error;
    }
  }

  /**
   * Search templates
   */
  public async searchTemplates(query: string): Promise<MessageTemplate[]> {
    try {
      const allTemplates = await this.getTemplates();
      
      return allTemplates.filter(template => 
        template.name.toLowerCase().includes(query.toLowerCase()) ||
        template.content.toLowerCase().includes(query.toLowerCase()) ||
        template.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    } catch (error) {
      this.errorService.handleError(error, 'Failed to search templates');
      throw error;
    }
  }
}
