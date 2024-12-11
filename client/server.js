const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();

// Enable gzip compression
app.use(compression());

// Serve static files
app.use(express.static(path.join(__dirname, 'build')));

// Handle PWA routes
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'manifest.json'));
});

app.get('/service-worker.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'service-worker.js'));
});

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
