import express from 'express';
import { getNextNumber } from '../controllers/CounterController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/next', authenticate, getNextNumber);

export default router;
