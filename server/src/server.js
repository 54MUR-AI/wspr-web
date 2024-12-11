const http = require('http');
const app = require('./app');
const WebSocketService = require('./services/websocket.service');
const { initializePerformanceMonitor } = require('./services/performanceMonitor');
const config = require('./config');

const server = http.createServer(app);

// Initialize WebSocket service
const wsService = new WebSocketService(server);

// Initialize performance monitoring
initializePerformanceMonitor();

const PORT = config.port || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
