module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create general metrics table
    await queryInterface.createTable('metrics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      tags: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create call metrics table
    await queryInterface.createTable('call_metrics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      callId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      packetsLost: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      jitter: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      roundTripTime: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      frameRate: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      resolution: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      audioLevel: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create transfer metrics table
    await queryInterface.createTable('transfer_metrics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      fileId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      bytesTransferred: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      totalBytes: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      speed: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      timeElapsed: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create indexes
    await queryInterface.addIndex('metrics', ['type', 'timestamp']);
    await queryInterface.addIndex('metrics', ['userId']);
    await queryInterface.addIndex('metrics', ['type', 'userId', 'timestamp']);
    await queryInterface.addIndex('call_metrics', ['callId', 'timestamp']);
    await queryInterface.addIndex('call_metrics', ['userId', 'timestamp']);
    await queryInterface.addIndex('transfer_metrics', ['fileId', 'timestamp']);
    await queryInterface.addIndex('transfer_metrics', ['userId', 'timestamp']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('transfer_metrics');
    await queryInterface.dropTable('call_metrics');
    await queryInterface.dropTable('metrics');
  },
};
