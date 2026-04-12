import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../errors/app-error';

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.name === 'AppError' ? 'APP_ERROR' : error.name,
        message: error.message
      }
    });
  }

  console.error('[GlobalErrorHandler]', error);

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocorreu um erro interno no servidor.'
    }
  });
}
