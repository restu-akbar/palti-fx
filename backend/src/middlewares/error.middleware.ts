import { NextFunction, Request, Response } from 'express';
import { errorResponse } from '../utils/response';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[Error Middleware]:', err);
  const status = err.status || 500;
  const message = err.message || 'Terjadi kesalahan pada server internal.';
  return errorResponse(res, message, status, err.stack);
}
