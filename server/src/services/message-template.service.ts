import { MessageTemplate } from '../models/MessageTemplate';
import { User } from '../models/User';
import { Op } from 'sequelize';

class MessageTemplateService {
  private static instance: MessageTemplateService;

  private constructor() {}

  public static getInstance(): MessageTemplateService {
    if (!MessageTemplateService.instance) {
      MessageTemplateService.instance = new MessageTemplateService();
    }
    return MessageTemplateService.instance;
  }

  /**
   * Create a new message template
   */
  async createTemplate(
    userId: string,
    name: string,
    content: string,
    category?: string,
    tags: string[] = []
  ): Promise<MessageTemplate> {
    return await MessageTemplate.create({
      userId,
      name,
      content,
      category,
      tags
    });
  }

  /**
   * Get templates for a user
   */
  async getTemplates(
    userId: string,
    options: {
      category?: string;
      tags?: string[];
      includeShared?: boolean;
    } = {}
  ): Promise<MessageTemplate[]> {
    const { category, tags, includeShared = true } = options;

    const whereClause: any = {
      [Op.or]: [{ userId }]
    };

    if (includeShared) {
      whereClause[Op.or].push({ isShared: true });
    }

    if (category) {
      whereClause.category = category;
    }

    if (tags && tags.length > 0) {
      whereClause.tags = {
        [Op.overlap]: tags
      };
    }

    return await MessageTemplate.findAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['id', 'username']
      }],
      order: [['updatedAt', 'DESC']]
    });
  }

  /**
   * Search templates
   */
  async searchTemplates(
    query: string,
    userId: string,
    includeShared = true
  ): Promise<MessageTemplate[]> {
    const whereClause: any = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${query}%` } },
        { content: { [Op.iLike]: `%${query}%` } },
        { category: { [Op.iLike]: `%${query}%` } },
        { tags: { [Op.overlap]: [query] } }
      ],
      [Op.and]: [{
        [Op.or]: [{ userId }]
      }]
    };

    if (includeShared) {
      whereClause[Op.and][0][Op.or].push({ isShared: true });
    }

    return await MessageTemplate.findAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['id', 'username']
      }],
      order: [['updatedAt', 'DESC']]
    });
  }

  /**
   * Update a template
   */
  async updateTemplate(
    templateId: string,
    userId: string,
    updates: Partial<MessageTemplate>
  ): Promise<MessageTemplate> {
    const template = await MessageTemplate.findOne({
      where: { id: templateId, userId }
    });

    if (!template) {
      throw new Error('Template not found or unauthorized');
    }

    await template.update(updates);
    return template;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string, userId: string): Promise<void> {
    const template = await MessageTemplate.findOne({
      where: { id: templateId, userId }
    });

    if (!template) {
      throw new Error('Template not found or unauthorized');
    }

    await template.destroy();
  }

  /**
   * Share/unshare a template
   */
  async toggleTemplateSharing(
    templateId: string,
    userId: string,
    shared: boolean
  ): Promise<MessageTemplate> {
    const template = await MessageTemplate.findOne({
      where: { id: templateId, userId }
    });

    if (!template) {
      throw new Error('Template not found or unauthorized');
    }

    await template.update({ isShared: shared });
    return template;
  }
}

export default MessageTemplateService.getInstance();
