const mongoose = require('mongoose');

const setupDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wspr';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to MongoDB:', error);
    throw error;
  }
};

module.exports = {
  setupDatabase
};
