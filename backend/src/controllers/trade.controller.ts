import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { TradeService } from '../services/trade.service';
import { errorResponse, successResponse } from '../utils/response';

export class TradeController {
  static getTrades(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const trades = TradeService.getUserTrades(userId);
      const summary = TradeService.getSummary(userId);
      return successResponse(res, 'Daftar trade berhasil diambil.', { trades, summary });
    } catch (err: any) {
      return errorResponse(res, err.message || 'Gagal mengambil data trade.', 500);
    }
  }

  static saveTrade(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { symbol, direction, lot, pl } = req.body;

      if (!symbol || !direction || lot === undefined || pl === undefined) {
        return errorResponse(res, 'Symbol, direction, lot, dan pl wajib diisi.', 400);
      }

      const trade = TradeService.saveTrade(userId, req.body);
      return successResponse(res, 'Catatan trade berhasil disimpan.', trade, 201);
    } catch (err: any) {
      return errorResponse(res, err.message || 'Gagal menyimpan catatan trade.', 500);
    }
  }

  static deleteTrade(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const tradeId = String(req.params.id);
      const deleted = TradeService.deleteTrade(userId, tradeId);
      if (!deleted) {
        return errorResponse(res, 'Catatan trade tidak ditemukan.', 404);
      }

      return successResponse(res, 'Catatan trade berhasil dihapus.');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Gagal menghapus catatan trade.', 500);
    }
  }

  static syncTrades(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { trades } = req.body;

      if (!Array.isArray(trades)) {
        return errorResponse(res, 'Payload trades harus berupa array.', 400);
      }

      for (const t of trades) {
        TradeService.saveTrade(userId, t);
      }

      const updatedTrades = TradeService.getUserTrades(userId);
      const summary = TradeService.getSummary(userId);

      return successResponse(res, 'Sinkronisasi trade berhasil.', { trades: updatedTrades, summary });
    } catch (err: any) {
      return errorResponse(res, err.message || 'Gagal sinkronisasi trade.', 500);
    }
  }
}
