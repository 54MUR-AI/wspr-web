import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 12;

export interface JWTPayload {
  id: string;
  email: string;
  publicKey: string;
}

/**
 * Hash a password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a password with a hash
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate a JWT token
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
};

/**
 * Verify a JWT token
 */
export const verifyToken = async (token: string): Promise<JWTPayload> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Verify user still exists and has access
    const user = await db.users.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, publicKey: true, active: true },
    });

    if (!user || !user.active) {
      throw new Error('User not found or inactive');
    }

    return {
      id: user.id,
      email: user.email,
      publicKey: user.publicKey,
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Extract user from request
 */
export const extractUser = async (
  authHeader?: string
): Promise<JWTPayload | null> => {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    return await verifyToken(token);
  } catch (error) {
    return null;
  }
};

/**
 * Middleware to require authentication
 */
export const requireAuth = async (
  req: any,
  res: any,
  next: any
): Promise<void> => {
  const user = await extractUser(req.headers.authorization);
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  req.user = user;
  next();
};
