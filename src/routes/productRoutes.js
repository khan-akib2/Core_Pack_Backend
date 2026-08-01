import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/ProductController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';

const router = express.Router();

router.get('/', authenticate, authorize([PERMISSIONS.PRODUCTS_READ]), getProducts);
router.get('/:id', authenticate, authorize([PERMISSIONS.PRODUCTS_READ]), getProductById);
router.post('/', authenticate, authorize([PERMISSIONS.PRODUCTS_MANAGE]), createProduct);
router.put('/:id', authenticate, authorize([PERMISSIONS.PRODUCTS_MANAGE]), updateProduct);
router.delete('/:id', authenticate, authorize([PERMISSIONS.PRODUCTS_MANAGE]), deleteProduct);

export default router;
