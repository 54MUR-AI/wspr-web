"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MessageTemplate_1 = require("../models/MessageTemplate");
const User_1 = require("../models/User");
const sequelize_1 = require("sequelize");
class MessageTemplateService {
    constructor() { }
    static getInstance() {
        if (!MessageTemplateService.instance) {
            MessageTemplateService.instance = new MessageTemplateService();
        }
        return MessageTemplateService.instance;
    }
    /**
     * Create a new message template
     */
    async createTemplate(userId, name, content, category, tags = []) {
        return await MessageTemplate_1.MessageTemplate.create({
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
    async getTemplates(userId, options = {}) {
        const { category, tags, includeShared = true } = options;
        const whereClause = {
            [sequelize_1.Op.or]: [{ userId }]
        };
        if (includeShared) {
            whereClause[sequelize_1.Op.or].push({ isShared: true });
        }
        if (category) {
            whereClause.category = category;
        }
        if (tags && tags.length > 0) {
            whereClause.tags = {
                [sequelize_1.Op.overlap]: tags
            };
        }
        return await MessageTemplate_1.MessageTemplate.findAll({
            where: whereClause,
            include: [{
                    model: User_1.User,
                    attributes: ['id', 'username']
                }],
            order: [['updatedAt', 'DESC']]
        });
    }
    /**
     * Search templates
     */
    async searchTemplates(query, userId, includeShared = true) {
        const whereClause = {
            [sequelize_1.Op.or]: [
                { name: { [sequelize_1.Op.iLike]: `%${query}%` } },
                { content: { [sequelize_1.Op.iLike]: `%${query}%` } },
                { category: { [sequelize_1.Op.iLike]: `%${query}%` } },
                { tags: { [sequelize_1.Op.overlap]: [query] } }
            ],
            [sequelize_1.Op.and]: [{
                    [sequelize_1.Op.or]: [{ userId }]
                }]
        };
        if (includeShared) {
            whereClause[sequelize_1.Op.and][0][sequelize_1.Op.or].push({ isShared: true });
        }
        return await MessageTemplate_1.MessageTemplate.findAll({
            where: whereClause,
            include: [{
                    model: User_1.User,
                    attributes: ['id', 'username']
                }],
            order: [['updatedAt', 'DESC']]
        });
    }
    /**
     * Update a template
     */
    async updateTemplate(templateId, userId, updates) {
        const template = await MessageTemplate_1.MessageTemplate.findOne({
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
    async deleteTemplate(templateId, userId) {
        const template = await MessageTemplate_1.MessageTemplate.findOne({
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
    async toggleTemplateSharing(templateId, userId, shared) {
        const template = await MessageTemplate_1.MessageTemplate.findOne({
            where: { id: templateId, userId }
        });
        if (!template) {
            throw new Error('Template not found or unauthorized');
        }
        await template.update({ isShared: shared });
        return template;
    }
}
exports.default = MessageTemplateService.getInstance();
