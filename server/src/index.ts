import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './middleware/error';
import { db } from './database';

const app = express();
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

// Error handler
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
