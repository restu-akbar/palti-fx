import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export function successResponse<T>(res: Response, message: string, data?: T, statusCode = 200) {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
}

export function errorResponse(res: Response, message: string, statusCode = 400, error?: string) {
  const payload: ApiResponse = {
    success: false,
    message,
    error: error || message,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
}
