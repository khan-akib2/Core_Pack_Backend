import express from 'express';
import { getCompanySettings, updateCompanySettings } from '../controllers/CompanyController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getCompanySettings);
router.put('/', authorizeRoles(ROLES.ADMIN), updateCompanySettings);

export default router;
