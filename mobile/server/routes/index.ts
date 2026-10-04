import { Router } from 'express';
import authRoutes from './auth.routes';
import marketRoutes from './market.routes';
import tradeRoutes from './trade.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/trades', tradeRoutes);
router.use('/market', marketRoutes);

export default router;
