'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MessageRetentions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      messageId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Messages',
          key: 'id'
        },
        unique: true
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      retentionType: {
        type: Sequelize.ENUM('self-destruct', 'retention-policy', 'manual'),
        defaultValue: 'retention-policy'
      },
      retentionPeriod: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      isExpired: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    await queryInterface.addIndex('MessageRetentions', ['messageId']);
    await queryInterface.addIndex('MessageRetentions', ['expiresAt']);
    await queryInterface.addIndex('MessageRetentions', ['isExpired']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('MessageRetentions');
  }
};
