'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add WebAuthn fields to Users table
    await queryInterface.addColumn('Users', 'currentChallenge', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add recovery key fields to Users table
    await queryInterface.addColumn('Users', 'recoveryKeyHash', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'recoveryKeyMetadata', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Create WebAuthnCredentials table
    await queryInterface.createTable('WebAuthnCredentials', {
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      credentialID: {
        type: Sequelize.BLOB,
        allowNull: false,
        unique: true
      },
      credentialPublicKey: {
        type: Sequelize.BLOB,
        allowNull: false
      },
      counter: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      credentialDeviceType: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'single_device'
      },
      credentialBackedUp: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      transports: {
        type: Sequelize.TEXT,
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
    await queryInterface.addIndex('WebAuthnCredentials', ['userId']);
    await queryInterface.addIndex('WebAuthnCredentials', ['credentialID']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove WebAuthn fields from Users table
    await queryInterface.removeColumn('Users', 'currentChallenge');
    await queryInterface.removeColumn('Users', 'recoveryKeyHash');
    await queryInterface.removeColumn('Users', 'recoveryKeyMetadata');

    // Drop WebAuthnCredentials table
    await queryInterface.dropTable('WebAuthnCredentials');
  }
};
