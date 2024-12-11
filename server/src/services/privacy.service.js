const PrivacySettings = require('../models/PrivacySettings');
const MessageRetention = require('../models/MessageRetention');
const Message = require('../models/Message');
const { Op } = require('sequelize');
const { scheduleJob } = require('node-schedule');

class PrivacyService {
  constructor() {
    this.initializeRetentionJobs();
  }

  async initializeRetentionJobs() {
    // Schedule job to check for expired messages every hour
    scheduleJob('0 * * * *', async () => {
      await this.processExpiredMessages();
    });
  }

  async getPrivacySettings(userId) {
    let settings = await PrivacySettings.findOne({ where: { userId } });
    if (!settings) {
      settings = await PrivacySettings.create({ userId });
    }
    return settings;
  }

  async updatePrivacySettings(userId, updates) {
    const settings = await this.getPrivacySettings(userId);
    return await settings.update(updates);
  }

  async setMessageExpiry(messageId, expirySeconds, type = 'manual') {
    const expiresAt = expirySeconds ? new Date(Date.now() + expirySeconds * 1000) : null;
    
    return await MessageRetention.create({
      messageId,
      expiresAt,
      retentionType: type,
      retentionPeriod: expirySeconds
    });
  }

  async processExpiredMessages() {
    const expiredRetentions = await MessageRetention.findAll({
      where: {
        expiresAt: {
          [Op.lte]: new Date()
        },
        isExpired: false
      },
      include: [Message]
    });

    for (const retention of expiredRetentions) {
      await this.handleMessageExpiry(retention);
    }
  }

  async handleMessageExpiry(retention) {
    const message = retention.Message;
    if (!message) return;

    // Update message content to indicate expiry
    await message.update({
      content: '[Message expired]',
      metadata: {
        ...message.metadata,
        expired: true,
        expiredAt: new Date()
      }
    });

    // Mark retention record as expired
    await retention.update({ isExpired: true });

    // Delete any associated files or media
    if (message.attachments && message.attachments.length > 0) {
      // TODO: Implement secure file deletion
    }
  }

  async applyThreadRetentionPolicy(threadId, retentionPeriod) {
    const messages = await Message.findAll({
      where: { threadId }
    });

    for (const message of messages) {
      await this.setMessageExpiry(message.id, retentionPeriod, 'retention-policy');
    }
  }

  async checkScreenshotPermission(userId, threadId) {
    const settings = await this.getPrivacySettings(userId);
    return settings.allowScreenshots;
  }

  async getMessageVisibility(messageId, userId) {
    const message = await Message.findByPk(messageId);
    if (!message) return false;

    const retention = await MessageRetention.findOne({
      where: { messageId }
    });

    if (retention && retention.isExpired) {
      return false;
    }

    // Add additional visibility checks here (e.g., thread membership, blocking)
    return true;
  }
}

module.exports = new PrivacyService();
