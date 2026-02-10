import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './middleware/error';
import { db } from './database';

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3001;

// Database connection (optional for now)
if (process.env.DATABASE_URL) {
  db.$connect()
    .then(() => console.log('Database connected'))
    .catch((error) => {
      console.warn('Database connection failed:', error.message);
    });
} else {
  console.log('No DATABASE_URL configured - running without database');
}

// Middleware
const allowedOrigins = [
  process.env.ORIGIN || 'http://localhost:3000',
  'https://roninmediagroup.com',
  'https://www.roninmediagroup.com',
  'https://roninmedia.studio',
  'https://www.roninmedia.studio',
  'https://wspr-web.onrender.com',
  'http://localhost:5173', // Vite dev
  'http://localhost:3000'  // Client dev
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameSrc: ["'self'", "https://roninmediagroup.com", "https://www.roninmediagroup.com", "https://roninmedia.studio", "https://www.roninmedia.studio"],
      frameAncestors: ["'self'", "https://roninmediagroup.com", "https://www.roninmediagroup.com", "https://roninmedia.studio", "https://www.roninmedia.studio"],
      connectSrc: ["'self'", "wss:", "ws:"],
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-channel', (channelId: string) => {
    socket.join(channelId);
    console.log(`Socket ${socket.id} joined channel: ${channelId}`);
  });

  socket.on('leave-channel', (channelId: string) => {
    socket.leave(channelId);
    console.log(`Socket ${socket.id} left channel: ${channelId}`);
  });

  socket.on('send-message', (data: { channelId: string; content: string; author: string; userId: string }) => {
    const message = {
      id: Date.now().toString(),
      channelId: data.channelId,
      content: data.content,
      author: data.author,
      userId: data.userId,
      timestamp: new Date().toISOString()
    };
    io.to(data.channelId).emit('new-message', message);
    console.log(`Message sent to channel ${data.channelId}:`, message);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handler
app.use(errorHandler);

// Start server
httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Socket.IO server is ready');
});
