import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database';
import { AppError } from '../utils/app-error';
import { JWT_SECRET } from '../config';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
      token?: string;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        disabled: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.disabled) {
      throw new AppError(403, 'User account is disabled');
    }

    req.user = { id: user.id, email: user.email };
    req.token = token;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Invalid token'));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        disabled: true,
      },
    });

    if (!user || user.disabled) {
      next();
      return;
    }

    req.user = { id: user.id, email: user.email };
    req.token = token;
    next();
  } catch (error) {
    next();
  }
};

export const requireRole = (role: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const user = await db.user.findUnique({
        where: { id: req.user.id },
        select: {
          roles: true,
        },
      });

      if (!user?.roles.includes(role)) {
        throw new AppError(403, 'Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
