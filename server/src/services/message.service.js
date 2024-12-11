const { Op } = require('sequelize');
const Message = require('../models/Message');
const { MessageThread, ThreadParticipant } = require('../models/MessageThread');
const User = require('../models/User');
const threadService = require('./thread.service');

class MessageService {
  /**
   * Create a new message
   */
  async createMessage(senderId, recipientId, content, encryptedKey, type = 'text', metadata = {}) {
    let thread = await MessageThread.findOne({
      include: [
        {
          model: User,
          through: ThreadParticipant,
          where: {
            id: {
              [Op.in]: [senderId, recipientId]
            }
          },
          attributes: []
        }
      ],
      having: sequelize.literal('COUNT(DISTINCT "Users"."id") = 2'),
      group: ['MessageThread.id']
    });

    if (!thread) {
      thread = await threadService.createThread(senderId, [recipientId]);
    }

    const message = await Message.create({
      senderId,
      recipientId,
      content,
      encryptedKey,
      type,
      metadata,
      threadId: thread.id
    });

    // Update thread's last message
    await thread.update({
      lastMessageId: message.id,
      messageCount: thread.messageCount + 1
    });

    return this.getMessageById(message.id);
  }

  /**
   * Get message by ID
   */
  async getMessageById(messageId, userId = null) {
    const message = await Message.findByPk(messageId, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'profilePicture']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'username', 'profilePicture']
        }
      ]
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (userId && ![message.senderId, message.recipientId].includes(userId)) {
      throw new Error('Unauthorized to view this message');
    }

    return message;
  }

  /**
   * Get messages for a thread
   */
  async getThreadMessages(threadId, userId, options = {}) {
    const {
      limit = 50,
      before = null,
      after = null,
      includeDeleted = false
    } = options;

    // Verify user is a participant
    const participant = await ThreadParticipant.findOne({
      where: { threadId, userId }
    });

    if (!participant) {
      throw new Error('User is not a participant in this thread');
    }

    const whereClause = { threadId };

    if (before) {
      whereClause.createdAt = { [Op.lt]: before };
    } else if (after) {
      whereClause.createdAt = { [Op.gt]: after };
    }

    if (!includeDeleted) {
      whereClause.deletedAt = null;
    }

    const messages = await Message.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit
    });

    return messages;
  }

  /**
   * Update message status
   */
  async updateMessageStatus(messageId, userId, status) {
    const message = await this.getMessageById(messageId);

    if (message.recipientId !== userId) {
      throw new Error('Only recipient can update message status');
    }

    await message.update({ status });
    return message;
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId, userId) {
    const message = await this.getMessageById(messageId);

    if (message.senderId !== userId) {
      throw new Error('Only sender can delete message');
    }

    await message.destroy();
  }

  /**
   * Get unread messages count
   */
  async getUnreadCount(userId) {
    return Message.count({
      where: {
        recipientId: userId,
        status: 'sent'
      }
    });
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(threadId, userId) {
    const messages = await Message.update(
      { status: 'read' },
      {
        where: {
          threadId,
          recipientId: userId,
          status: { [Op.ne]: 'read' }
        }
      }
    );

    // Update thread's last read message
    const lastMessage = await Message.findOne({
      where: { threadId },
      order: [['createdAt', 'DESC']]
    });

    if (lastMessage) {
      await threadService.markThreadAsRead(threadId, userId, lastMessage.id);
    }

    return messages;
  }
}

module.exports = new MessageService();
