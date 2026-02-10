const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'WSPR Backend is running' });
});

// Placeholder for future routes
router.get('/', (req, res) => {
  res.json({ 
    message: 'WSPR API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health'
    }
  });
});

module.exports = router;
