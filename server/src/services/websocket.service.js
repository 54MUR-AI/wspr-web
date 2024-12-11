const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { Message } = require('../models/Message');
const config = require('../config');

class WebSocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: config.clientUrl,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket'],
    });

    this.userSockets = new Map(); // userId -> Set<Socket>
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, config.jwtSecret);
        const user = await User.findByPk(decoded.userId);
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      socket.on('message:send', async (encryptedMessage) => {
        await this.handleMessage(socket, encryptedMessage);
      });

      socket.on('message:status:update', (data) => {
        this.handleMessageStatus(socket, data);
      });

      socket.on('typing:update', (data) => {
        this.handleTypingStatus(socket, data);
      });
    });
  }

  handleConnection(socket) {
    const userId = socket.user.id;
    
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socket);

    // Update user status
    socket.user.update({ status: 'online', lastSeen: new Date() });

    // Broadcast user presence to relevant users
    this.broadcastUserPresence(userId, 'online');

    console.log(`User ${userId} connected`);
  }

  handleDisconnect(socket) {
    const userId = socket.user.id;
    const userSockets = this.userSockets.get(userId);
    
    if (userSockets) {
      userSockets.delete(socket);
      if (userSockets.size === 0) {
        this.userSockets.delete(userId);
        
        // Update user status
        socket.user.update({ status: 'offline', lastSeen: new Date() });

        // Broadcast user presence to relevant users
        this.broadcastUserPresence(userId, 'offline');
      }
    }

    console.log(`User ${userId} disconnected`);
  }

  async handleMessage(socket, encryptedMessage) {
    try {
      // Store encrypted message
      const message = await Message.create({
        content: encryptedMessage,
        senderId: socket.user.id,
        timestamp: new Date(),
        status: 'sent',
      });

      // Get recipient's sockets
      const recipientSockets = this.userSockets.get(message.recipientId);
      
      if (recipientSockets) {
        // Send to all recipient's devices
        recipientSockets.forEach((recipientSocket) => {
          recipientSocket.emit('message:new', encryptedMessage);
        });

        // Update message status to delivered
        message.update({ status: 'delivered' });
      }

      // Acknowledge message receipt to sender
      socket.emit('message:status', {
        messageId: message.id,
        status: 'sent',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('message:error', {
        error: 'Failed to process message',
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleMessageStatus(socket, { messageId, status }) {
    Message.findByPk(messageId).then((message) => {
      if (message) {
        message.update({ status });
        
        // Notify sender of status update
        const senderSockets = this.userSockets.get(message.senderId);
        if (senderSockets) {
          senderSockets.forEach((senderSocket) => {
            senderSocket.emit('message:status', {
              messageId,
              status,
              timestamp: new Date().toISOString(),
              userId: socket.user.id,
            });
          });
        }
      }
    });
  }

  handleTypingStatus(socket, { recipientId, isTyping }) {
    const recipientSockets = this.userSockets.get(recipientId);
    if (recipientSockets) {
      recipientSockets.forEach((recipientSocket) => {
        recipientSocket.emit('typing:status', {
          userId: socket.user.id,
          recipientId,
          isTyping,
          timestamp: new Date().toISOString(),
        });
      });
    }
  }

  broadcastUserPresence(userId, status) {
    // Get all connected users who should receive the presence update
    // In a real app, you might want to only notify friends or recent contacts
    this.io.emit('presence:update', userId, status);
  }
}

module.exports = WebSocketService;
