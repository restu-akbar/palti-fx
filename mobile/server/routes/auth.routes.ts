import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', AuthController.login);
router.post('/activate', AuthController.activate);
router.post('/otp/request', AuthController.requestOtp);
router.post('/otp/verify', AuthController.verifyOtp);
router.post('/reset-password', AuthController.resetPassword);

// Protected routes
router.get('/me', requireAuth, AuthController.getMe);
router.post('/logout', requireAuth, AuthController.logout);

export default router;
