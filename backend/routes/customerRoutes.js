import express from 'express';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerPurchases,
  addPurchaseToCustomer,
  getCustomerStats,
} from '../controllers/customerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { sanitizeBody, sanitizeQuery, validateCustomerData } from '../middleware/validation.js';

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeBody);
router.use(sanitizeQuery);

// Statistics route (must be before /:id route)
router.get('/stats/overview', protect, getCustomerStats);

// Main CRUD routes (all protected)
router.route('/').get(protect, getCustomers).post(protect, validateCustomerData, createCustomer);

router
  .route('/:id')
  .get(protect, getCustomer)
  .put(protect, updateCustomer)
  .delete(protect, authorize('admin', 'manager'), deleteCustomer);

// Purchase history routes
router
  .route('/:id/purchases')
  .get(protect, getCustomerPurchases)
  .post(protect, addPurchaseToCustomer);

export default router;
