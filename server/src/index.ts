import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './middleware/error';
import authRoutes from './routes/auth';
import { db } from './database';

const app = express();
const port = process.env.PORT || 3001;

// Database connection
db.$connect()
  .then(() => console.log('Database connected'))
  .catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1);
  });

// Middleware
app.use(cors({
  origin: process.env.ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
