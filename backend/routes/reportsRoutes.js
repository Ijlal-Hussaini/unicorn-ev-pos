import express from 'express';
import {
  getDashboardStats,
  getRevenueTrend,
  getCategoryBreakdown,
  getTopProducts,
  exportReport,
  getPerformanceMetrics,
} from '../controllers/reportsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.get('/dashboard', protect, getDashboardStats);
router.get('/revenue-trend', protect, getRevenueTrend);
router.get('/category-breakdown', protect, getCategoryBreakdown);
router.get('/top-products', protect, getTopProducts);
router.get('/performance', protect, getPerformanceMetrics);
router.get('/export/:type', protect, exportReport);

export default router;
