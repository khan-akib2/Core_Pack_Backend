import express from 'express';
import { getBackups, createBackup, restoreBackup, deleteBackup } from '../controllers/BackupController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// Only Admins and Owners can manage backups
router.use(authenticate, authorize([ROLES.ADMIN, ROLES.OWNER]));

router.get('/', getBackups);
router.post('/create', createBackup);
router.post('/restore/:filename', restoreBackup);
router.delete('/:filename', deleteBackup);

export default router;
