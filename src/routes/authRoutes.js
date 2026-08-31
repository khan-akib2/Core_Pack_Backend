import express from 'express';
import { login, refreshToken, getMe, logout, updatePushToken } from '../controllers/AuthController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);
router.put('/session/push-token', authenticate, updatePushToken);


export default router;
