import { NextFunction, Request, Response } from 'express';
import { UserPayload } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { errorResponse } from '../utils/response';

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Akses ditolak. Token autentikasi tidak ditemukan.', 401);
  }

  const token = authHeader.split(' ')[1];
  const payload = AuthService.verifyToken(token);

  if (!payload) {
    return errorResponse(res, 'Sesi tidak valid atau telah kedaluwarsa. Silakan login kembali.', 401);
  }

  req.user = payload;
  next();
}
