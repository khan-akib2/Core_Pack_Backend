import express from 'express';
import { getNextNumber } from '../controllers/CounterController.js';

const router = express.Router();

router.get('/next', getNextNumber);

export default router;
