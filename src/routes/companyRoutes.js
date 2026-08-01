import express from 'express';
import { getCompanySettings, updateCompanySettings } from '../controllers/CompanyController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = express.Router();

router.get('/', authenticate, authorize([PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.REPORTS_VIEW]), getCompanySettings);
router.put('/', authenticate, authorize([PERMISSIONS.SETTINGS_MANAGE]), updateCompanySettings);

export default router;
