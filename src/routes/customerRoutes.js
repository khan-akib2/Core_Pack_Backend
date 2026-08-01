import express from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '../controllers/CustomerController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = express.Router();

router.get('/', authenticate, authorize([PERMISSIONS.CUSTOMERS_READ]), getCustomers);
router.get('/:id', authenticate, authorize([PERMISSIONS.CUSTOMERS_READ]), getCustomerById);
router.post('/', authenticate, authorize([PERMISSIONS.CUSTOMERS_MANAGE]), createCustomer);
router.put('/:id', authenticate, authorize([PERMISSIONS.CUSTOMERS_MANAGE]), updateCustomer);
router.delete('/:id', authenticate, authorize([PERMISSIONS.CUSTOMERS_MANAGE]), deleteCustomer);

export default router;
