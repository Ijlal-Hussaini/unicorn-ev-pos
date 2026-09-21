import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import crypto from 'crypto';
import {
  sendOTPEmail,
  sendPasswordResetSuccessEmail,
  sendEmailChangeOTP,
  sendEmailChangeSuccessEmail,
} from '../utils/emailService.js';

// @desc    Register new user (Admin only)
// @route   POST /api/users/register
// @access  Private (Admin)
const registerUser = async (req, res) => {
  try {
    const { username, email, password, role, phone, cnic } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.email === email
            ? 'Email already registered'
            : 'Username already taken',
      });
    }

    // Create user (password will be hashed by pre-save middleware)
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'sales',
      phone: phone || null,
      cnic: cnic || null,
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: userResponse,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error registering user',
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Compare password using bcrypt
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Set cookie (optional - for backward compatibility)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: userResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message,
    });
  }
};

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    // Clear cookie
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message,
    });
  }
};

// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const { role, isActive, search } = req.query;

    // Build query
    let query = {};

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message,
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if email or username is being updated and already exists
    if (req.body.email && req.body.email !== user.email) {
      const existingEmail = await User.findOne({ email: req.body.email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
    }

    if (req.body.username && req.body.username !== user.username) {
      const existingUsername = await User.findOne({
        username: req.body.username,
      });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken',
        });
      }
    }

    // Don't allow password update through this route
    delete req.body.password;

    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating user',
      error: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message,
    });
  }
};

// @desc    Change password
// @route   PATCH /api/users/:id/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    const user = await User.findById(req.params.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password using bcrypt
    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error changing password',
      error: error.message,
    });
  }
};

// @desc    Request password reset (send OTP)
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address',
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Return error if user doesn't exist
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.',
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Hash OTP before storing
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    // Save OTP and expiry (10 minutes)
    user.resetPasswordOTP = hashedOTP;
    user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send OTP via email
    try {
      await sendOTPEmail(user.email, otp, user.username);

      res.status(200).json({
        success: true,
        message: 'OTP sent to your email address',
      });
    } catch (emailError) {
      // Clear OTP if email fails
      user.resetPasswordOTP = undefined;
      user.resetPasswordOTPExpires = undefined;
      await user.save();

      console.error('Email sending failed:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again later.',
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
      error: error.message,
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/users/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP',
      });
    }

    // Hash the provided OTP
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    // Find user with matching OTP and valid expiry
    const user = await User.findOne({
      email,
      resetPasswordOTP: hashedOTP,
      resetPasswordOTPExpires: { $gt: Date.now() },
    }).select('+resetPasswordOTP +resetPasswordOTPExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message,
    });
  }
};

// @desc    Reset password with OTP
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, OTP, and new password',
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Hash the provided OTP
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    // Find user with matching OTP and valid expiry
    const user = await User.findOne({
      email,
      resetPasswordOTP: hashedOTP,
      resetPasswordOTPExpires: { $gt: Date.now() },
    }).select('+resetPasswordOTP +resetPasswordOTPExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    // Send confirmation email (non-blocking)
    try {
      await sendPasswordResetSuccessEmail(user.email, user.username);
    } catch (emailError) {
      console.error('Failed to send password reset confirmation email:', emailError);
      // Don't fail the request if email fails - password is already reset
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message,
    });
  }
};

// @desc    Request email change (send OTP to new email)
// @route   POST /api/users/request-email-change
// @access  Private
const requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user._id;

    if (!newEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new email address',
      });
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if new email is same as current
    if (user.email === newEmail) {
      return res.status(400).json({
        success: false,
        message: 'New email is same as current email',
      });
    }

    // Check if new email already exists
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use by another account',
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Hash OTP before storing
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    // Save OTP, expiry, and pending email (10 minutes)
    user.changeEmailOTP = hashedOTP;
    user.changeEmailOTPExpires = Date.now() + 10 * 60 * 1000;
    user.pendingEmail = newEmail;
    await user.save();

    // Send OTP to new email
    try {
      await sendEmailChangeOTP(newEmail, otp, user.username);

      res.status(200).json({
        success: true,
        message: 'Verification code sent to new email address',
      });
    } catch (emailError) {
      // Clear OTP if email fails
      user.changeEmailOTP = undefined;
      user.changeEmailOTPExpires = undefined;
      user.pendingEmail = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing email change request',
      error: error.message,
    });
  }
};

// @desc    Verify email change OTP and update email
// @route   POST /api/users/verify-email-change
// @access  Private
const verifyEmailChange = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user._id;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide OTP',
      });
    }

    // Hash the provided OTP
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    // Find user with matching OTP and valid expiry
    const user = await User.findOne({
      _id: userId,
      changeEmailOTP: hashedOTP,
      changeEmailOTPExpires: { $gt: Date.now() },
    }).select('+changeEmailOTP +changeEmailOTPExpires +pendingEmail');

    if (!user || !user.pendingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    const oldEmail = user.email;
    const newEmail = user.pendingEmail;

    // Update email
    user.email = newEmail;
    user.changeEmailOTP = undefined;
    user.changeEmailOTPExpires = undefined;
    user.pendingEmail = undefined;
    await user.save();

    // Send confirmation emails
    await sendEmailChangeSuccessEmail(oldEmail, newEmail, user.username);

    // Return updated user data
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.changeEmailOTP;
    delete userResponse.changeEmailOTPExpires;
    delete userResponse.pendingEmail;

    res.status(200).json({
      success: true,
      message: 'Email updated successfully',
      data: userResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying email change',
      error: error.message,
    });
  }
};

export {
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
};
