'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PrivacySettings', {
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
        },
        unique: true
      },
      messageRetention: {
        type: Sequelize.ENUM('forever', '30days', '7days', '24hours'),
        defaultValue: 'forever'
      },
      showReadReceipts: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      showTypingIndicator: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      showLastSeen: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      showProfilePhoto: {
        type: Sequelize.ENUM('everyone', 'contacts', 'nobody'),
        defaultValue: 'everyone'
      },
      allowScreenshots: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      defaultMessageExpiry: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      encryptedBackup: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      twoFactorEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    await queryInterface.addIndex('PrivacySettings', ['userId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PrivacySettings');
  }
};
