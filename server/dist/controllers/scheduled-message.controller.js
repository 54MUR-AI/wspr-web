"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledMessageController = void 0;
const scheduled_message_service_1 = __importDefault(require("../services/scheduled-message.service"));
const validation_1 = require("../middleware/validation");
const zod_1 = require("zod");
// Validation schemas
const recurringPatternSchema = zod_1.z.object({
    frequency: zod_1.z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: zod_1.z.number().min(1).optional(),
    daysOfWeek: zod_1.z.array(zod_1.z.number().min(0).max(6)).optional(),
    dayOfMonth: zod_1.z.number().min(1).max(31).optional(),
    monthOfYear: zod_1.z.number().min(1).max(12).optional(),
    endDate: zod_1.z.string().datetime().optional(),
    maxOccurrences: zod_1.z.number().min(1).optional()
});
const createScheduledMessageSchema = zod_1.z.object({
    threadId: zod_1.z.string().uuid(),
    content: zod_1.z.string().min(1),
    scheduledFor: zod_1.z.string().datetime(),
    recurring: zod_1.z.boolean().optional(),
    recurringPattern: recurringPatternSchema.optional()
});
const updateScheduledMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).optional(),
    scheduledFor: zod_1.z.string().datetime().optional(),
    recurring: zod_1.z.boolean().optional(),
    recurringPattern: recurringPatternSchema.optional()
});
class ScheduledMessageController {
    /**
     * Create a new scheduled message
     */
    static async createScheduledMessage(req, res) {
        try {
            const { threadId, content, scheduledFor, recurring, recurringPattern } = (0, validation_1.validateRequest)(req.body, createScheduledMessageSchema);
            const userId = req.user.id;
            const message = await scheduled_message_service_1.default.createScheduledMessage(userId, threadId, content, new Date(scheduledFor), recurring, recurringPattern);
            res.status(201).json(message);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * Get scheduled messages for the current user
     */
    static async getScheduledMessages(req, res) {
        try {
            const userId = req.user.id;
            const { threadId, status, startDate, endDate } = req.query;
            const messages = await scheduled_message_service_1.default.getScheduledMessages(userId, {
                threadId: threadId,
                status: status,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined
            });
            res.json(messages);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Update a scheduled message
     */
    static async updateScheduledMessage(req, res) {
        try {
            const { messageId } = req.params;
            const userId = req.user.id;
            const updates = (0, validation_1.validateRequest)(req.body, updateScheduledMessageSchema);
            // Convert scheduledFor to Date if present
            if (updates.scheduledFor) {
                updates.scheduledFor = new Date(updates.scheduledFor);
            }
            const message = await scheduled_message_service_1.default.updateScheduledMessage(messageId, userId, updates);
            res.json(message);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * Cancel a scheduled message
     */
    static async cancelScheduledMessage(req, res) {
        try {
            const { messageId } = req.params;
            const userId = req.user.id;
            await scheduled_message_service_1.default.cancelScheduledMessage(messageId, userId);
            res.status(204).send();
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.ScheduledMessageController = ScheduledMessageController;
