import { Request, Response, NextFunction, RequestHandler } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AppError } from '../utils/app-error';

// Async handler wrapper
export const asyncHandler = (fn: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next))
      .catch((error) => {
        console.error('AsyncHandler Error:', error);
        next(error);
      });
  };
};

// Error handler middleware
export const errorHandler = (
  err: Error | AppError | JsonWebTokenError | TokenExpiredError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', err);

  // Handle AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Handle JWT errors
  if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
    });
  }

  // Handle other errors
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};
