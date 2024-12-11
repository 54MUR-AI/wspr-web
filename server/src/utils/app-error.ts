export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    options?: { code?: string; cause?: unknown }
  ) {
    super(message);
    this.name = 'AppError';
    if (options?.cause) {
      this.cause = options.cause;
    }
    if (options?.code) {
      this.code = options.code;
    }
    Error.captureStackTrace(this, this.constructor);
  }

  public code?: string;
  public cause?: unknown;
}
