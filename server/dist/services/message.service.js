"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../utils/auth");
const database_1 = require("../database");
class MessageService {
    constructor(io) {
        this.users = new Map();
        this.io = io;
        this.setupSocketServer();
    }
    setupSocketServer() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                const user = await (0, auth_1.verifyToken)(token);
                socket.data.user = user;
                next();
            }
            catch (error) {
                next(new Error('Authentication failed'));
            }
        });
        this.io.on('connection', (socket) => {
            const userId = socket.data.user.id;
            // Store user connection
            this.users.set(userId, {
                id: userId,
                socketId: socket.id,
                publicKey: socket.data.user.publicKey,
            });
            // Handle message sending
            socket.on('message:send', async (message) => {
                try {
                    // Store message in database
                    await this.storeMessage(message);
                    // Get recipient's socket
                    const recipient = this.users.get(message.recipientId);
                    if (recipient) {
                        // Send to recipient if online
                        this.io.to(recipient.socketId).emit('message:received', message);
                    }
                    // Confirm message sent
                    socket.emit('message:status', {
                        messageId: message.id,
                        status: 'sent',
                    });
                }
                catch (error) {
                    console.error('Failed to send message:', error);
                    socket.emit('error', {
                        type: 'message:send',
                        message: 'Failed to send message',
                    });
                }
            });
            // Handle message status updates
            socket.on('message:status', async ({ messageId, status, }) => {
                try {
                    // Update message status in database
                    await this.updateMessageStatus(messageId, status);
                    // Get the original message
                    const message = await this.getMessage(messageId);
                    if (message) {
                        // Notify the sender of the status update
                        const sender = this.users.get(message.senderId);
                        if (sender) {
                            this.io.to(sender.socketId).emit('message:status', {
                                messageId,
                                status,
                            });
                        }
                    }
                }
                catch (error) {
                    console.error('Failed to update message status:', error);
                }
            });
            // Handle disconnection
            socket.on('disconnect', () => {
                this.users.delete(userId);
            });
        });
    }
    /**
     * Store a message in the database
     */
    async storeMessage(message) {
        await database_1.db.messages.create({
            data: {
                id: message.id,
                senderId: message.senderId,
                recipientId: message.recipientId,
                content: message.content,
                timestamp: message.timestamp,
                status: message.status,
            },
        });
    }
    /**
     * Update a message's status in the database
     */
    async updateMessageStatus(messageId, status) {
        await database_1.db.messages.update({
            where: { id: messageId },
            data: { status },
        });
    }
    /**
     * Get a message from the database
     */
    async getMessage(messageId) {
        return await database_1.db.messages.findUnique({
            where: { id: messageId },
        });
    }
    /**
     * Get all messages between two users
     */
    async getMessageHistory(userId, otherId, limit = 50, before) {
        return await database_1.db.messages.findMany({
            where: {
                OR: [
                    { senderId: userId, recipientId: otherId },
                    { senderId: otherId, recipientId: userId },
                ],
                ...(before ? { timestamp: { lt: before } } : {}),
            },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
    }
    /**
     * Get undelivered messages for a user
     */
    async getUndeliveredMessages(userId) {
        return await database_1.db.messages.findMany({
            where: {
                recipientId: userId,
                status: 'sent',
            },
            orderBy: { timestamp: 'asc' },
        });
    }
}
exports.default = MessageService;
