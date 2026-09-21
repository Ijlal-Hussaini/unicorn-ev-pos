import express from 'express';
import {
  getRefunds,
  getRefund,
  createRefund,
  approveRefund,
  rejectRefund,
  completeRefund,
  deleteRefund,
  getRefundStats,
} from '../controllers/refundController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { sanitizeBody, sanitizeQuery } from '../middleware/validation.js';

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeBody);
router.use(sanitizeQuery);

// Statistics route (must be before /:id route)
router.get('/stats/overview', protect, getRefundStats);

// Main CRUD routes
router
  .route('/')
  .get(protect, getRefunds)
  .post(protect, createRefund);

router
  .route('/:id')
  .get(protect, getRefund)
  .delete(protect, authorize('admin'), deleteRefund);

// Refund action routes
router.put('/:id/approve', protect, authorize('admin', 'manager'), approveRefund);
router.put('/:id/reject', protect, authorize('admin', 'manager'), rejectRefund);
router.put('/:id/complete', protect, authorize('admin', 'manager'), completeRefund);

export default router;
