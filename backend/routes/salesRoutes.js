import express from 'express';
import {
  getSales,
  getSale,
  createSale,
  updateSale,
  deleteSale,
  getSalesStats,
  getSalesChart,
} from '../controllers/salesController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { sanitizeBody, sanitizeQuery, validateSaleData } from '../middleware/validation.js';

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeBody);
router.use(sanitizeQuery);

// Statistics routes (must be before /:id route)
router.get('/stats/overview', protect, getSalesStats);
router.get('/stats/chart', protect, getSalesChart);

// Main CRUD routes (all protected)
router
  .route('/')
  .get(protect, getSales)
  .post(protect, validateSaleData, createSale);

router
  .route('/:id')
  .get(protect, getSale)
  .put(protect, updateSale)
  .delete(protect, authorize('admin', 'manager'), deleteSale);

export default router;
