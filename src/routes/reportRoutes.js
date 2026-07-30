import express from 'express';
import { getSalesReport, getGstr1Report } from '../controllers/ReportController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT));

router.get('/sales', getSalesReport);
router.get('/gstr-1', getGstr1Report);

export default router;
