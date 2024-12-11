'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ScheduledMessages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      threadId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'MessageThreads',
          key: 'id'
        }
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      scheduledFor: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'failed', 'cancelled'),
        defaultValue: 'pending'
      },
      recurring: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      recurringPattern: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'JSON object containing recurring schedule details (frequency, interval, etc.)'
      },
      nextOccurrence: {
        type: Sequelize.DATE,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('ScheduledMessages', ['userId']);
    await queryInterface.addIndex('ScheduledMessages', ['threadId']);
    await queryInterface.addIndex('ScheduledMessages', ['scheduledFor']);
    await queryInterface.addIndex('ScheduledMessages', ['status']);
    await queryInterface.addIndex('ScheduledMessages', ['nextOccurrence']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ScheduledMessages');
  }
};
