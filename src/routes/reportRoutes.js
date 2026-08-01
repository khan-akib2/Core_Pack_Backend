import express from 'express';
import { getSalesReport, getGstr1Report } from '../controllers/ReportController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = express.Router();

router.get('/sales', authenticate, authorize([PERMISSIONS.REPORTS_VIEW]), getSalesReport);
router.get('/gstr-1', authenticate, authorize([PERMISSIONS.REPORTS_VIEW]), getGstr1Report);

export default router;
