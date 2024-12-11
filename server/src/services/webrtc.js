const { Server } = require('socket.io');
const { verifyToken } = require('./auth');

class WebRTCService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL,
        methods: ['GET', 'POST']
      }
    });

    this.rooms = new Map();
    this.userSockets = new Map();

    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          throw new Error('Authentication token missing');
        }

        const user = await verifyToken(token);
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.id} connected`);
      this.userSockets.set(socket.user.id, socket);

      socket.on('call:start', (data) => this.handleCallStart(socket, data));
      socket.on('call:answer', (data) => this.handleCallAnswer(socket, data));
      socket.on('call:ice-candidate', (data) => this.handleIceCandidate(socket, data));
      socket.on('call:end', (data) => this.handleCallEnd(socket, data));
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  async handleCallStart(socket, { recipientId, offer }) {
    try {
      const recipientSocket = this.userSockets.get(recipientId);
      if (!recipientSocket) {
        socket.emit('call:error', { message: 'Recipient is offline' });
        return;
      }

      const roomId = this.generateRoomId(socket.user.id, recipientId);
      
      // Create or join room
      this.rooms.set(roomId, {
        participants: [socket.user.id, recipientId],
        startTime: Date.now()
      });

      socket.join(roomId);
      recipientSocket.join(roomId);

      // Send offer to recipient
      recipientSocket.emit('call:incoming', {
        callerId: socket.user.id,
        callerName: socket.user.name,
        offer,
        roomId
      });

    } catch (error) {
      console.error('Error in call start:', error);
      socket.emit('call:error', { message: 'Failed to start call' });
    }
  }

  async handleCallAnswer(socket, { callerId, answer, roomId }) {
    try {
      const callerSocket = this.userSockets.get(callerId);
      if (!callerSocket) {
        socket.emit('call:error', { message: 'Caller is offline' });
        return;
      }

      const room = this.rooms.get(roomId);
      if (!room) {
        socket.emit('call:error', { message: 'Call room not found' });
        return;
      }

      // Send answer to caller
      callerSocket.emit('call:accepted', {
        recipientId: socket.user.id,
        recipientName: socket.user.name,
        answer
      });

    } catch (error) {
      console.error('Error in call answer:', error);
      socket.emit('call:error', { message: 'Failed to answer call' });
    }
  }

  async handleIceCandidate(socket, { recipientId, candidate }) {
    try {
      const recipientSocket = this.userSockets.get(recipientId);
      if (recipientSocket) {
        recipientSocket.emit('call:ice-candidate', {
          senderId: socket.user.id,
          candidate
        });
      }
    } catch (error) {
      console.error('Error in ICE candidate:', error);
    }
  }

  async handleCallEnd(socket, { roomId }) {
    try {
      const room = this.rooms.get(roomId);
      if (room) {
        // Notify all participants
        this.io.to(roomId).emit('call:ended', {
          endedBy: socket.user.id
        });

        // Clean up
        this.rooms.delete(roomId);
        this.io.in(roomId).socketsLeave(roomId);
      }
    } catch (error) {
      console.error('Error in call end:', error);
    }
  }

  handleDisconnect(socket) {
    try {
      console.log(`User ${socket.user.id} disconnected`);
      this.userSockets.delete(socket.user.id);

      // End any active calls
      for (const [roomId, room] of this.rooms.entries()) {
        if (room.participants.includes(socket.user.id)) {
          this.handleCallEnd(socket, { roomId });
        }
      }
    } catch (error) {
      console.error('Error in disconnect:', error);
    }
  }

  generateRoomId(userId1, userId2) {
    return [userId1, userId2].sort().join('-');
  }

  // Helper method to get TURN/STUN server configuration
  getTurnConfig() {
    return {
      iceServers: [
        {
          urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302'
          ]
        },
        {
          urls: process.env.TURN_SERVER_URL,
          username: process.env.TURN_SERVER_USERNAME,
          credential: process.env.TURN_SERVER_CREDENTIAL
        }
      ]
    };
  }
}

module.exports = WebRTCService;
