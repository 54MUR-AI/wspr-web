'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create MessageThreads table
    await queryInterface.createTable('MessageThreads', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('direct', 'group'),
        defaultValue: 'direct'
      },
      lastMessageId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Messages',
          key: 'id'
        }
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      isPinned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isArchived: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      messageCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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

    // Create ThreadParticipants table
    await queryInterface.createTable('ThreadParticipants', {
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
      role: {
        type: Sequelize.ENUM('owner', 'admin', 'member'),
        defaultValue: 'member'
      },
      lastReadMessageId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Messages',
          key: 'id'
        }
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      mutedUntil: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Add indexes
    await queryInterface.addIndex('MessageThreads', ['lastMessageId']);
    await queryInterface.addIndex('MessageThreads', ['createdAt']);
    await queryInterface.addIndex('ThreadParticipants', ['userId', 'threadId'], {
      unique: true
    });
    await queryInterface.addIndex('ThreadParticipants', ['lastReadMessageId']);

    // Add threadId column to Messages table
    await queryInterface.addColumn('Messages', 'threadId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'MessageThreads',
        key: 'id'
      }
    });
    await queryInterface.addIndex('Messages', ['threadId']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes and foreign key constraints
    await queryInterface.removeIndex('Messages', ['threadId']);
    await queryInterface.removeColumn('Messages', 'threadId');
    
    await queryInterface.removeIndex('ThreadParticipants', ['userId', 'threadId']);
    await queryInterface.removeIndex('ThreadParticipants', ['lastReadMessageId']);
    
    await queryInterface.removeIndex('MessageThreads', ['lastMessageId']);
    await queryInterface.removeIndex('MessageThreads', ['createdAt']);

    // Drop tables in reverse order
    await queryInterface.dropTable('ThreadParticipants');
    await queryInterface.dropTable('MessageThreads');
  }
};
