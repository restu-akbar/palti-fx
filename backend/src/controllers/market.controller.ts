import { Request, Response } from 'express';
import { MarketService } from '../services/market.service';
import { successResponse } from '../utils/response';

export class MarketController {
  static getStatus(req: Request, res: Response) {
    const status = MarketService.getStatus();
    return successResponse(res, 'Data sesi pasar berhasil diambil.', status);
  }
}
