"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageTemplateController = void 0;
const message_template_service_1 = __importDefault(require("../services/message-template.service"));
const validation_1 = require("../middleware/validation");
const zod_1 = require("zod");
// Validation schemas
const createTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    content: zod_1.z.string().min(1),
    category: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional()
});
const updateTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    content: zod_1.z.string().min(1).optional(),
    category: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional()
});
class MessageTemplateController {
    /**
     * Create a new message template
     */
    static async createTemplate(req, res) {
        try {
            const { name, content, category, tags } = (0, validation_1.validateRequest)(req.body, createTemplateSchema);
            const userId = req.user.id;
            const template = await message_template_service_1.default.createTemplate(userId, name, content, category, tags);
            res.status(201).json(template);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * Get templates for the current user
     */
    static async getTemplates(req, res) {
        try {
            const userId = req.user.id;
            const { category, tags, includeShared } = req.query;
            const templates = await message_template_service_1.default.getTemplates(userId, {
                category: category,
                tags: tags ? tags.split(',') : undefined,
                includeShared: includeShared === 'true'
            });
            res.json(templates);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Search templates
     */
    static async searchTemplates(req, res) {
        try {
            const userId = req.user.id;
            const { query, includeShared } = req.query;
            if (!query || typeof query !== 'string') {
                return res.status(400).json({ error: 'Query parameter is required' });
            }
            const templates = await message_template_service_1.default.searchTemplates(query, userId, includeShared === 'true');
            res.json(templates);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Update a template
     */
    static async updateTemplate(req, res) {
        try {
            const { templateId } = req.params;
            const userId = req.user.id;
            const updates = (0, validation_1.validateRequest)(req.body, updateTemplateSchema);
            const template = await message_template_service_1.default.updateTemplate(templateId, userId, updates);
            res.json(template);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * Delete a template
     */
    static async deleteTemplate(req, res) {
        try {
            const { templateId } = req.params;
            const userId = req.user.id;
            await message_template_service_1.default.deleteTemplate(templateId, userId);
            res.status(204).send();
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * Toggle template sharing
     */
    static async toggleSharing(req, res) {
        try {
            const { templateId } = req.params;
            const userId = req.user.id;
            const { shared } = req.body;
            if (typeof shared !== 'boolean') {
                return res.status(400).json({ error: 'shared parameter must be a boolean' });
            }
            const template = await message_template_service_1.default.toggleTemplateSharing(templateId, userId, shared);
            res.json(template);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.MessageTemplateController = MessageTemplateController;
