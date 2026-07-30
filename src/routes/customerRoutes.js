import express from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '../controllers/CustomerController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT), createCustomer);
router.put('/:id', authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT), updateCustomer);
router.delete('/:id', authorizeRoles(ROLES.ADMIN), deleteCustomer);

export default router;
