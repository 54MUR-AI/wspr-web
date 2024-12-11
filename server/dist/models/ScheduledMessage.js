"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledMessage = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../database");
const User_1 = require("./User");
const MessageThread_1 = require("./MessageThread");
class ScheduledMessage extends sequelize_1.Model {
    /**
     * Calculate the next occurrence based on recurring pattern
     */
    calculateNextOccurrence() {
        if (!this.recurring || !this.recurringPattern) {
            return null;
        }
        const { frequency, interval = 1, endDate, maxOccurrences } = this.recurringPattern;
        const baseDate = this.nextOccurrence || this.scheduledFor;
        let nextDate;
        switch (frequency) {
            case 'daily':
                nextDate = new Date(baseDate);
                nextDate.setDate(nextDate.getDate() + interval);
                break;
            case 'weekly':
                nextDate = new Date(baseDate);
                nextDate.setDate(nextDate.getDate() + (interval * 7));
                break;
            case 'monthly':
                nextDate = new Date(baseDate);
                nextDate.setMonth(nextDate.getMonth() + interval);
                break;
            case 'yearly':
                nextDate = new Date(baseDate);
                nextDate.setFullYear(nextDate.getFullYear() + interval);
                break;
            default:
                return null;
        }
        // Check if we've exceeded endDate or maxOccurrences
        if (endDate && nextDate > new Date(endDate)) {
            return null;
        }
        if (maxOccurrences) {
            const occurrenceCount = Math.floor((nextDate.getTime() - this.scheduledFor.getTime()) /
                (nextDate.getTime() - baseDate.getTime()));
            if (occurrenceCount >= maxOccurrences) {
                return null;
            }
        }
        return nextDate;
    }
}
exports.ScheduledMessage = ScheduledMessage;
ScheduledMessage.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    threadId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'MessageThreads',
            key: 'id'
        }
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false
    },
    scheduledFor: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'sent', 'failed', 'cancelled'),
        defaultValue: 'pending'
    },
    recurring: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false
    },
    recurringPattern: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true
    },
    nextOccurrence: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        defaultValue: {}
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false
    }
}, {
    sequelize: database_1.sequelize,
    tableName: 'ScheduledMessages',
    modelName: 'ScheduledMessage'
});
// Define associations
ScheduledMessage.belongsTo(User_1.User, {
    foreignKey: 'userId',
    as: 'user'
});
ScheduledMessage.belongsTo(MessageThread_1.MessageThread, {
    foreignKey: 'threadId',
    as: 'thread'
});
