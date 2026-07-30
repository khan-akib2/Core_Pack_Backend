import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/ProductController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), createProduct);
router.put('/:id', authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), updateProduct);
router.delete('/:id', authorizeRoles(ROLES.ADMIN), deleteProduct);

export default router;
