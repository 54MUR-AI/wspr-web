import {
  Model,
  DataTypes,
  Optional,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Association
} from 'sequelize';
import { sequelize } from '../database';
import { User } from './User';
import { MessageThread } from './MessageThread';

interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  monthOfYear?: number;
  endDate?: Date;
  maxOccurrences?: number;
}

interface ScheduledMessageAttributes {
  id: string;
  userId: string;
  threadId: string;
  content: string;
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  recurring: boolean;
  recurringPattern?: RecurringPattern;
  nextOccurrence?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface ScheduledMessageCreationAttributes
  extends Optional<ScheduledMessageAttributes, 'id' | 'status' | 'recurring' | 'recurringPattern' | 'nextOccurrence' | 'metadata'> {}

class ScheduledMessage extends Model<ScheduledMessageAttributes, ScheduledMessageCreationAttributes>
  implements ScheduledMessageAttributes {
  public id!: string;
  public userId!: string;
  public threadId!: string;
  public content!: string;
  public scheduledFor!: Date;
  public status!: 'pending' | 'sent' | 'failed' | 'cancelled';
  public recurring!: boolean;
  public recurringPattern?: RecurringPattern;
  public nextOccurrence?: Date;
  public metadata!: Record<string, any>;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Associations
  public getUser!: BelongsToGetAssociationMixin<User>;
  public setUser!: BelongsToSetAssociationMixin<User, string>;
  public getThread!: BelongsToGetAssociationMixin<MessageThread>;
  public setThread!: BelongsToSetAssociationMixin<MessageThread, string>;

  public readonly user?: User;
  public readonly thread?: MessageThread;

  public static associations: {
    user: Association<ScheduledMessage, User>;
    thread: Association<ScheduledMessage, MessageThread>;
  };

  /**
   * Calculate the next occurrence based on recurring pattern
   */
  public calculateNextOccurrence(): Date | null {
    if (!this.recurring || !this.recurringPattern) {
      return null;
    }

    const { frequency, interval = 1, endDate, maxOccurrences } = this.recurringPattern;
    const baseDate = this.nextOccurrence || this.scheduledFor;
    let nextDate: Date;

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
      const occurrenceCount = Math.floor(
        (nextDate.getTime() - this.scheduledFor.getTime()) /
        (nextDate.getTime() - baseDate.getTime())
      );
      if (occurrenceCount >= maxOccurrences) {
        return null;
      }
    }

    return nextDate;
  }
}

ScheduledMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    threadId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'MessageThreads',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    scheduledFor: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed', 'cancelled'),
      defaultValue: 'pending'
    },
    recurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    recurringPattern: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    nextOccurrence: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'ScheduledMessages',
    modelName: 'ScheduledMessage'
  }
);

// Define associations
ScheduledMessage.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

ScheduledMessage.belongsTo(MessageThread, {
  foreignKey: 'threadId',
  as: 'thread'
});

export { ScheduledMessage, RecurringPattern };
