import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  status?: number;
  code?: string;
}

export class ErrorHandler {
  static handle(
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    const code = err.code || 'INTERNAL_ERROR';

    console.error(`[Error] ${status} - ${code}: ${message}`);

    res.status(status).json({
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }

  static notFound(req: Request, res: Response, next: NextFunction): void {
    const error: CustomError = new Error(`Route not found: ${req.originalUrl}`);
    error.status = 404;
    error.code = 'NOT_FOUND';
    next(error);
  }

  static validationError(
    errors: any[],
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors,
      },
    });
  }
}
