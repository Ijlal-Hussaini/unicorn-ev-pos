import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getInventoryStats,
  getAvailableUnits,
  addSerializedUnit,
  deleteSerializedUnit,
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { sanitizeBody, sanitizeQuery, validateProductData } from '../middleware/validation.js';

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeBody);
router.use(sanitizeQuery);

// Inventory stats route (must be before /:id route) - Protected
router.get('/stats/inventory', protect, getInventoryStats);

// Serialized units routes
router.get('/:id/units/available', protect, getAvailableUnits);
router.post('/:id/units', protect, authorize('admin', 'manager'), addSerializedUnit);
router.delete('/:id/units/:unitId', protect, authorize('admin', 'manager'), deleteSerializedUnit);

// Main CRUD routes - All protected
router.route('/')
  .get(protect, getProducts)
  .post(protect, authorize('admin', 'manager'), validateProductData, createProduct);

router.route('/:id')
  .get(protect, getProduct)
  .put(protect, authorize('admin', 'manager'), updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);

// Stock management route - Admin and Manager only
router.patch('/:id/stock', protect, authorize('admin', 'manager'), updateStock);

export default router;
