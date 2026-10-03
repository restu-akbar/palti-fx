import { Router } from 'express';
import { TradeController } from '../controllers/trade.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', TradeController.getTrades);
router.post('/', TradeController.saveTrade);
router.delete('/:id', TradeController.deleteTrade);
router.post('/sync', TradeController.syncTrades);

export default router;
