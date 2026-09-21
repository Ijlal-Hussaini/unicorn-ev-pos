import cloudinary from '../config/cloudinary.js';
import User from '../models/userModel.js';
import fs from 'fs';
import logger from '../utils/logger.js';

// @desc    Upload user profile photo
// @route   POST /api/upload/profile
// @access  Private
const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Upload to Cloudinary using buffer or file path
    const uploadOptions = {
      folder: 'unicorn-ev/profiles',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
      ],
    };

    let result;
    if (req.file.path) {
      // Upload from file path
      result = await cloudinary.uploader.upload(req.file.path, uploadOptions);
      
      // Delete the temporary file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    } else if (req.file.buffer) {
      // Upload from buffer
      result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(req.file.buffer);
      });
    }

    // Update user profile with photo URL
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePhoto: result.secure_url },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        profilePhoto: result.secure_url,
        user,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading photo',
      error: error.message,
    });
  }
};

// @desc    Delete user profile photo
// @route   DELETE /api/upload/profile
// @access  Private
const deleteProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.profilePhoto) {
      return res.status(400).json({
        success: false,
        message: 'No profile photo to delete',
      });
    }

    // Extract public_id from URL
    const urlParts = user.profilePhoto.split('/');
    const publicId = `unicorn-ev/profiles/${urlParts[urlParts.length - 1].split('.')[0]}`;

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Remove from user profile
    user.profilePhoto = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile photo deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting photo',
      error: error.message,
    });
  }
};

// @desc    Upload product photos (multiple)
// @route   POST /api/upload/product
// @access  Private (Admin only)
const uploadProductPhoto = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    // Upload all photos to Cloudinary
    const uploadOptions = {
      folder: 'unicorn-ev/products',
      transformation: [
        { width: 800, height: 600, crop: 'fill' },
        { quality: 'auto' },
      ],
    };

    const uploadPromises = req.files.map(async (file) => {
      let result;
      if (file.path) {
        result = await cloudinary.uploader.upload(file.path, uploadOptions);
        
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      } else if (file.buffer) {
        result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }).end(file.buffer);
        });
      }
      return result.secure_url;
    });

    const photoUrls = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      message: 'Product photos uploaded successfully',
      data: {
        photoUrls,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading photos',
      error: error.message,
    });
  }
};

// @desc    Delete product photo
// @route   DELETE /api/upload/product/:productId
// @access  Private (Admin only)
const deleteProductPhoto = async (req, res) => {
  try {
    const { photoUrl } = req.body;
    
    if (!photoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Photo URL is required',
      });
    }

    // Extract public_id from URL
    const urlParts = photoUrl.split('/');
    const publicId = `unicorn-ev/products/${urlParts[urlParts.length - 1].split('.')[0]}`;

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    res.status(200).json({
      success: true,
      message: 'Product photo deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting photo',
      error: error.message,
    });
  }
};

export { uploadProfilePhoto, deleteProfilePhoto, uploadProductPhoto, deleteProductPhoto };
