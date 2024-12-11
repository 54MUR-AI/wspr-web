const { Op } = require('sequelize');
const { MessageThread, ThreadParticipant } = require('../models/MessageThread');
const Message = require('../models/Message');
const User = require('../models/User');

class ThreadService {
  /**
   * Create a new message thread
   */
  async createThread(userId, participants, title = null) {
    const thread = await MessageThread.create({
      title,
      type: participants.length > 1 ? 'group' : 'direct'
    });

    // Add participants including the creator
    const allParticipants = [...new Set([userId, ...participants])];
    await Promise.all(
      allParticipants.map((participantId, index) =>
        ThreadParticipant.create({
          userId: participantId,
          threadId: thread.id,
          role: index === 0 ? 'owner' : 'member'
        })
      )
    );

    return this.getThreadById(thread.id);
  }

  /**
   * Get thread by ID with participants and last message
   */
  async getThreadById(threadId, userId = null) {
    const thread = await MessageThread.findByPk(threadId, {
      include: [
        {
          model: User,
          through: { attributes: ['role', 'lastReadMessageId'] },
          attributes: ['id', 'username', 'profilePicture', 'status']
        },
        {
          model: Message,
          as: 'lastMessage',
          attributes: ['id', 'content', 'senderId', 'createdAt']
        }
      ]
    });

    if (!thread) {
      throw new Error('Thread not found');
    }

    if (userId) {
      const isParticipant = await ThreadParticipant.findOne({
        where: { threadId, userId }
      });
      if (!isParticipant) {
        throw new Error('User is not a participant in this thread');
      }
    }

    return thread;
  }

  /**
   * Get all threads for a user
   */
  async getUserThreads(userId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      archived = false,
      search = null
    } = options;

    const whereClause = {
      isArchived: archived
    };

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { '$Users.username$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    const threads = await MessageThread.findAll({
      include: [
        {
          model: User,
          through: {
            where: { userId },
            attributes: ['role', 'lastReadMessageId']
          },
          attributes: ['id', 'username', 'profilePicture', 'status']
        },
        {
          model: Message,
          as: 'lastMessage',
          attributes: ['id', 'content', 'senderId', 'createdAt']
        }
      ],
      where: whereClause,
      order: [['updatedAt', 'DESC']],
      limit,
      offset
    });

    return threads;
  }

  /**
   * Update thread details
   */
  async updateThread(threadId, userId, updates) {
    const thread = await MessageThread.findByPk(threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    const participant = await ThreadParticipant.findOne({
      where: { threadId, userId }
    });

    if (!participant || !['owner', 'admin'].includes(participant.role)) {
      throw new Error('Unauthorized to update thread');
    }

    await thread.update(updates);
    return this.getThreadById(threadId);
  }

  /**
   * Add participants to a thread
   */
  async addParticipants(threadId, userId, newParticipants) {
    const thread = await MessageThread.findByPk(threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    const participant = await ThreadParticipant.findOne({
      where: { threadId, userId }
    });

    if (!participant || !['owner', 'admin'].includes(participant.role)) {
      throw new Error('Unauthorized to add participants');
    }

    await Promise.all(
      newParticipants.map((participantId) =>
        ThreadParticipant.create({
          userId: participantId,
          threadId,
          role: 'member'
        })
      )
    );

    return this.getThreadById(threadId);
  }

  /**
   * Remove a participant from a thread
   */
  async removeParticipant(threadId, userId, participantId) {
    const thread = await MessageThread.findByPk(threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    const participant = await ThreadParticipant.findOne({
      where: { threadId, userId }
    });

    if (!participant || !['owner', 'admin'].includes(participant.role)) {
      throw new Error('Unauthorized to remove participants');
    }

    await ThreadParticipant.destroy({
      where: { threadId, userId: participantId }
    });

    return this.getThreadById(threadId);
  }

  /**
   * Update participant role
   */
  async updateParticipantRole(threadId, userId, participantId, newRole) {
    const thread = await MessageThread.findByPk(threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    const participant = await ThreadParticipant.findOne({
      where: { threadId, userId }
    });

    if (!participant || participant.role !== 'owner') {
      throw new Error('Only thread owner can update roles');
    }

    await ThreadParticipant.update(
      { role: newRole },
      { where: { threadId, userId: participantId } }
    );

    return this.getThreadById(threadId);
  }

  /**
   * Mark thread as read for a user
   */
  async markThreadAsRead(threadId, userId, messageId) {
    await ThreadParticipant.update(
      { lastReadMessageId: messageId },
      { where: { threadId, userId } }
    );
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId) {
    const threads = await MessageThread.findAll({
      include: [
        {
          model: User,
          through: {
            where: { userId },
            attributes: ['lastReadMessageId']
          }
        },
        {
          model: Message,
          as: 'lastMessage'
        }
      ],
      where: {
        isArchived: false
      }
    });

    return threads.reduce((count, thread) => {
      const participant = thread.Users[0].ThreadParticipant;
      if (
        thread.lastMessage &&
        (!participant.lastReadMessageId ||
          participant.lastReadMessageId !== thread.lastMessage.id)
      ) {
        return count + 1;
      }
      return count;
    }, 0);
  }
}

module.exports = new ThreadService();
