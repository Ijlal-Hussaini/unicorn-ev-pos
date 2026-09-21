import express from 'express';
import { uploadProfilePhoto, deleteProfilePhoto, uploadProductPhoto, deleteProductPhoto } from '../controllers/uploadController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Profile photo upload (protected)
router.post('/profile', protect, upload.single('photo'), uploadProfilePhoto);

// Profile photo delete (protected)
router.delete('/profile', protect, deleteProfilePhoto);

// Product photos upload (admin only) - supports multiple files
router.post('/product', protect, authorize('admin'), upload.array('photos', 5), uploadProductPhoto);

// Product photo delete (admin only)
router.delete('/product', protect, authorize('admin'), deleteProductPhoto);

export default router;
