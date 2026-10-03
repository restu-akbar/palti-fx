import { Router } from 'express';
import { MarketController } from '../controllers/market.controller';

const router = Router();

router.get('/status', MarketController.getStatus);

export default router;
