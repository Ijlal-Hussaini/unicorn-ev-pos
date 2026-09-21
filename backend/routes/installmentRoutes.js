import express from 'express';
import {
  getInstallmentPlans,
  getInstallmentPlan,
  createInstallmentPlan,
  recordPayment,
  getPaymentHistory,
  markAsDefaulted,
  cancelInstallmentPlan,
  getOverdueInstallments,
  getInstallmentStats,
} from '../controllers/installmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public stats route (requires auth)
router.get('/stats/overview', protect, getInstallmentStats);

// Overdue installments
router.get('/overdue', protect, getOverdueInstallments);

// Main installment routes
router.route('/')
  .get(protect, getInstallmentPlans)
  .post(protect, authorize('admin', 'sales'), createInstallmentPlan);

// Single installment plan routes
router.route('/:id')
  .get(protect, getInstallmentPlan);

// Payment routes
router.route('/:id/payment')
  .post(protect, authorize('admin', 'sales'), recordPayment);

router.route('/:id/payments')
  .get(protect, getPaymentHistory);

// Status management routes (admin/manager only)
router.route('/:id/default')
  .put(protect, authorize('admin', 'sales'), markAsDefaulted);

router.route('/:id/cancel')
  .put(protect, authorize('admin', 'sales'), cancelInstallmentPlan);

export default router;
