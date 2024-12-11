"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const ScheduledMessage_1 = require("../models/ScheduledMessage");
const MessageThread_1 = require("../models/MessageThread");
const User_1 = require("../models/User");
const message_service_1 = __importDefault(require("./message.service"));
class ScheduledMessageService {
    constructor() {
        // Initialize scheduler
        this.startScheduler();
    }
    static getInstance() {
        if (!ScheduledMessageService.instance) {
            ScheduledMessageService.instance = new ScheduledMessageService();
        }
        return ScheduledMessageService.instance;
    }
    /**
     * Create a new scheduled message
     */
    async createScheduledMessage(userId, threadId, content, scheduledFor, recurring = false, recurringPattern) {
        const message = await ScheduledMessage_1.ScheduledMessage.create({
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
    async getScheduledMessages(userId, options = {}) {
        const { threadId, status, startDate, endDate } = options;
        const whereClause = { userId };
        if (threadId) {
            whereClause.threadId = threadId;
        }
        if (status) {
            whereClause.status = status;
        }
        if (startDate || endDate) {
            whereClause.scheduledFor = {};
            if (startDate) {
                whereClause.scheduledFor[sequelize_1.Op.gte] = startDate;
            }
            if (endDate) {
                whereClause.scheduledFor[sequelize_1.Op.lte] = endDate;
            }
        }
        return await ScheduledMessage_1.ScheduledMessage.findAll({
            where: whereClause,
            include: [
                {
                    model: User_1.User,
                    as: 'user',
                    attributes: ['id', 'username']
                },
                {
                    model: MessageThread_1.MessageThread,
                    as: 'thread'
                }
            ],
            order: [['scheduledFor', 'ASC']]
        });
    }
    /**
     * Update a scheduled message
     */
    async updateScheduledMessage(messageId, userId, updates) {
        const message = await ScheduledMessage_1.ScheduledMessage.findOne({
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
    async cancelScheduledMessage(messageId, userId) {
        const message = await ScheduledMessage_1.ScheduledMessage.findOne({
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
    async processScheduledMessages() {
        try {
            // Find all pending messages that are due
            const dueMessages = await ScheduledMessage_1.ScheduledMessage.findAll({
                where: {
                    status: 'pending',
                    scheduledFor: {
                        [sequelize_1.Op.lte]: new Date()
                    }
                },
                include: [
                    {
                        model: MessageThread_1.MessageThread,
                        as: 'thread'
                    }
                ]
            });
            for (const message of dueMessages) {
                try {
                    // Send the message
                    await message_service_1.default.sendMessage(message.userId, message.threadId, message.content);
                    // Update message status
                    await message.update({ status: 'sent' });
                    // If recurring, calculate and set next occurrence
                    if (message.recurring) {
                        const nextOccurrence = message.calculateNextOccurrence();
                        if (nextOccurrence) {
                            await this.createScheduledMessage(message.userId, message.threadId, message.content, nextOccurrence, true, message.recurringPattern);
                        }
                    }
                }
                catch (error) {
                    await message.update({
                        status: 'failed',
                        metadata: {
                            ...message.metadata,
                            error: error.message
                        }
                    });
                }
            }
        }
        catch (error) {
            console.error('Error processing scheduled messages:', error);
        }
    }
    /**
     * Start the scheduler
     */
    startScheduler() {
        // Process messages every minute
        setInterval(() => {
            this.processScheduledMessages();
        }, 60000);
    }
}
exports.default = ScheduledMessageService.getInstance();
