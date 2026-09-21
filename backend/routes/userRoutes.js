import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  changePassword,
  forgotPassword,
  verifyOTP,
  resetPassword,
  requestEmailChange,
  verifyEmailChange,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { sanitizeBody, sanitizeQuery, validateUserData } from '../middleware/validation.js';

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeBody);
router.use(sanitizeQuery);

// Public routes
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

// Admin only - user registration
router.post('/register', protect, authorize('admin'), validateUserData, registerUser);

// Protected routes
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getCurrentUser);

// Email change routes (protected)
router.post('/request-email-change', protect, requestEmailChange);
router.post('/verify-email-change', protect, verifyEmailChange);

// Admin/Manager routes
router.get('/', protect, authorize('admin', 'manager'), getUsers);

// User management routes (protected)
router
  .route('/:id')
  .get(protect, getUser)
  .put(protect, updateUser)
  .delete(protect, authorize('admin'), deleteUser);

// Password change route (protected)
router.patch('/:id/password', protect, changePassword);

export default router;
