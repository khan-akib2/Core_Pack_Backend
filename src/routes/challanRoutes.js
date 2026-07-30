import express from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateChallanStatus,
  deleteChallan
} from '../controllers/DeliveryChallanController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getChallans);
router.get('/:id', getChallanById);
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.STAFF), createChallan);
router.patch('/:id/status', updateChallanStatus);
router.delete('/:id', authorizeRoles(ROLES.ADMIN), deleteChallan);

export default router;
