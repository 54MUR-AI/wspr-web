const { Sequelize } = require('sequelize');
const config = require('../config/config.json');
const PrivacySettings = require('./models/PrivacySettings');
const MessageRetention = require('./models/MessageRetention');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize({
  dialect: dbConfig.dialect,
  storage: dbConfig.storage
});

async function migrate() {
  try {
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
