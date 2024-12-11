import jwt from 'jsonwebtoken';
import { AppError } from './app-error';
import { JWT_SECRET } from '../config';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

interface TokenPayload {
  userId: string;
  email: string;
}

interface User {
  id: string;
  email: string;
}

export const generateToken = (user: User): string => {
  try {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
    };
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  } catch (error) {
    throw new AppError(500, 'Error generating token');
  }
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, 'Invalid token');
    }
    throw new AppError(401, 'Token verification failed');
  }
};

export const extractToken = (authHeader: string | undefined): string => {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'No token provided');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new AppError(401, 'Invalid token format');
  }

  return token;
};
