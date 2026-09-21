import Refund from '../models/refundModel.js';
import Sales from '../models/salesModel.js';
import Product from '../models/productModel.js';

// Generate refund ID with collision handling
const generateRefundId = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    // Count refunds today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const count = await Refund.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });
    
    const sequence = String(count + 1 + attempts).padStart(4, '0');
    const refundId = `REF-${year}${month}${day}-${sequence}`;
    
    // Check if ID already exists
    const existing = await Refund.findOne({ refundId });
    if (!existing) {
      return refundId;
    }
    
    attempts++;
  }
  
  // Fallback to timestamp-based ID if collision persists
  return `REF-${year}${month}${day}-${Date.now()}`;
};

// @desc    Get all refunds
// @route   GET /api/refunds
// @access  Private
const getRefunds = async (req, res) => {
  try {
    const {
      status,
      customer,
      reason,
      startDate,
      endDate,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    // Build query
    let query = {};

    if (status) {
      query.status = status;
    }

    if (customer) {
      query.customer = { $regex: customer, $options: 'i' };
    }

    if (reason) {
      query.reason = reason;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const refunds = await Refund.find(query)
      .populate('product', 'sku model category name')
      .populate('sale', 'invoiceId total')
      .populate('processedBy', 'username email')
      .populate('approvedBy', 'username email')
      .sort(sortOptions);

    res.status(200).json({
      success: true,
      count: refunds.length,
      data: refunds,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching refunds',
      error: error.message,
    });
  }
};

// @desc    Get single refund
// @route   GET /api/refunds/:id
// @access  Private
const getRefund = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id)
      .populate('product', 'sku model category name price')
      .populate('sale', 'invoiceId total quantity paymentMethod')
      .populate('processedBy', 'username email role')
      .populate('approvedBy', 'username email role');

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Refund not found',
      });
    }

    res.status(200).json({
      success: true,
      data: refund,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching refund',
      error: error.message,
    });
  }
};

// @desc    Create new refund
// @route   POST /api/refunds
// @access  Private
const createRefund = async (req, res) => {
  const session = await Refund.startSession();
  
  try {
    const {
      saleId,
      quantityRefunded,
      reason,
      reasonDetails,
      refundMethod,
      notes,
      restockProduct = true,
    } = req.body;

    // Validate quantity
    if (!quantityRefunded || quantityRefunded < 1) {
      return res.status(400).json({
        success: false,
        message: 'Refund quantity must be at least 1',
      });
    }

    // Start transaction
    await session.startTransaction();

    // Get original sale
    const sale = await Sales.findById(saleId)
      .populate('product')
      .session(session);

    if (!sale) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Original sale not found',
      });
    }

    // Check if sale is completed
    if (sale.status !== 'completed') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed sales',
      });
    }

    // Check if sale is already fully refunded
    if (sale.isFullyRefunded) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'This sale has already been fully refunded',
      });
    }

    // Check if quantity is valid
    if (quantityRefunded > sale.quantity) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cannot refund more than original quantity (${sale.quantity})`,
      });
    }

    // Check if already refunded - only count approved/completed refunds
    const existingRefunds = await Refund.find({ 
      sale: saleId,
      status: { $in: ['approved', 'completed'] }
    }).session(session);
    const totalRefunded = existingRefunds.reduce((sum, ref) => sum + ref.quantityRefunded, 0);
    
    if (totalRefunded + quantityRefunded > sale.quantity) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cannot refund ${quantityRefunded} units. Already refunded: ${totalRefunded}, Available: ${sale.quantity - totalRefunded}`,
      });
    }

    // Calculate refund amount
    const refundAmount = sale.price * quantityRefunded;

    // Generate refund ID
    const refundId = await generateRefundId();

    // Create refund
    const refund = await Refund.create([{
      refundId,
      sale: saleId,
      invoiceId: sale.invoiceId,
      customer: sale.customer,
      customerEmail: sale.customerEmail,
      customerPhone: sale.customerPhone,
      product: sale.product._id,
      model: sale.model,
      quantityRefunded,
      originalQuantity: sale.quantity,
      pricePerUnit: sale.price,
      refundAmount,
      originalTotal: sale.total,
      refundMethod: refundMethod || sale.paymentMethod,
      reason,
      reasonDetails,
      status: 'pending',
      processedBy: req.user._id,
      notes,
      restockProduct,
    }], { session });

    // Commit transaction
    await session.commitTransaction();

    // Populate the refund data
    const populatedRefund = await Refund.findById(refund[0]._id)
      .populate('product', 'sku model category name')
      .populate('sale', 'invoiceId total')
      .populate('processedBy', 'username email');

    res.status(201).json({
      success: true,
      message: 'Refund request created successfully',
      data: populatedRefund,
    });
  } catch (error) {
    await session.abortTransaction();
    
    res.status(400).json({
      success: false,
      message: 'Error creating refund',
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// @desc    Approve refund
// @desc    Approve refund
// @route   PUT /api/refunds/:id/approve
// @access  Private (Manager/Admin)
const approveRefund = async (req, res) => {
  const session = await Refund.startSession();
  
  try {
    await session.startTransaction();

    const refund = await Refund.findById(req.params.id).session(session);

    if (!refund) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Refund not found',
      });
    }

    if (refund.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cannot approve refund with status: ${refund.status}`,
      });
    }

    // Update refund status
    refund.status = 'approved';
    refund.approvedBy = req.user._id;
    refund.approvedAt = new Date();
    await refund.save({ session });

    // Update the original sale to reflect the refund
    const sale = await Sales.findById(refund.sale).session(session);
    if (sale) {
      sale.refundedQuantity = (sale.refundedQuantity || 0) + refund.quantityRefunded;
      sale.refundedAmount = (sale.refundedAmount || 0) + refund.refundAmount;
      
      // Check if partially or fully refunded
      if (sale.refundedQuantity >= sale.quantity) {
        sale.isFullyRefunded = true;
        sale.isPartiallyRefunded = false;
        sale.status = 'refunded'; // Set status to refunded
      } else if (sale.refundedQuantity > 0) {
        sale.isPartiallyRefunded = true;
        sale.isFullyRefunded = false;
        // Keep status as completed for partial refunds
      }
      
      await sale.save({ session });
    }

    // If restock is enabled, add quantity back to product
    if (refund.restockProduct) {
      const product = await Product.findById(refund.product).session(session);
      if (product) {
        product.stock += refund.quantityRefunded;
        await product.save({ session });
      }
    }

    await session.commitTransaction();

    // Populate and return updated refund
    const updatedRefund = await Refund.findById(refund._id)
      .populate('product', 'sku model category name')
      .populate('sale', 'invoiceId total')
      .populate('processedBy', 'username email')
      .populate('approvedBy', 'username email');

    res.status(200).json({
      success: true,
      message: 'Refund approved successfully. Sale has been updated.',
      data: updatedRefund,
    });
  } catch (error) {
    await session.abortTransaction();
    
    res.status(400).json({
      success: false,
      message: 'Error approving refund',
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// @desc    Reject refund
// @route   PUT /api/refunds/:id/reject
// @access  Private (Manager/Admin)
const rejectRefund = async (req, res) => {
  try {
    const { notes } = req.body;

    const refund = await Refund.findById(req.params.id);

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Refund not found',
      });
    }

    if (refund.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject refund with status: ${refund.status}`,
      });
    }

    refund.status = 'rejected';
    refund.approvedBy = req.user._id;
    refund.approvedAt = new Date();
    
    // Preserve original notes and append rejection reason
    if (notes) {
      refund.notes = refund.notes 
        ? `${refund.notes}\n\n[REJECTED BY ${req.user.username || 'Admin'}]: ${notes}` 
        : `[REJECTED]: ${notes}`;
    }
    
    await refund.save();

    const updatedRefund = await Refund.findById(refund._id)
      .populate('product', 'sku model category name')
      .populate('sale', 'invoiceId total')
      .populate('processedBy', 'username email')
      .populate('approvedBy', 'username email');

    res.status(200).json({
      success: true,
      message: 'Refund rejected',
      data: updatedRefund,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error rejecting refund',
      error: error.message,
    });
  }
};

// @desc    Complete refund (mark as completed after payment)
// @route   PUT /api/refunds/:id/complete
// @access  Private (Manager/Admin)
const completeRefund = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id);

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Refund not found',
      });
    }

    if (refund.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Can only complete approved refunds',
      });
    }

    refund.status = 'completed';
    await refund.save();

    const updatedRefund = await Refund.findById(refund._id)
      .populate('product', 'sku model category name')
      .populate('sale', 'invoiceId total')
      .populate('processedBy', 'username email')
      .populate('approvedBy', 'username email');

    res.status(200).json({
      success: true,
      message: 'Refund completed successfully',
      data: updatedRefund,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error completing refund',
      error: error.message,
    });
  }
};

// @desc    Delete refund
// @route   DELETE /api/refunds/:id
// @access  Private (Admin)
const deleteRefund = async (req, res) => {
  const session = await Refund.startSession();
  
  try {
    await session.startTransaction();

    const refund = await Refund.findById(req.params.id).session(session);

    if (!refund) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Refund not found',
      });
    }

    // If refund was approved or completed, reverse all changes
    if (refund.status === 'approved' || refund.status === 'completed') {
      // Update the original sale to remove refunded amounts
      const sale = await Sales.findById(refund.sale).session(session);
      if (sale) {
        sale.refundedQuantity = Math.max(0, (sale.refundedQuantity || 0) - refund.quantityRefunded);
        sale.refundedAmount = Math.max(0, (sale.refundedAmount || 0) - refund.refundAmount);
        
        // Update refund status flags
        if (sale.refundedQuantity === 0) {
          sale.isPartiallyRefunded = false;
          sale.isFullyRefunded = false;
          sale.status = 'completed'; // Revert status back to completed
        } else if (sale.refundedQuantity >= sale.quantity) {
          sale.isFullyRefunded = true;
          sale.isPartiallyRefunded = false;
          sale.status = 'refunded';
        } else {
          sale.isPartiallyRefunded = true;
          sale.isFullyRefunded = false;
          sale.status = 'completed'; // Partial refunds keep completed status
        }
        
        await sale.save({ session });
      }

      // If refund was restocked, remove the stock that was added
      if (refund.restockProduct) {
        const product = await Product.findById(refund.product).session(session);
        if (product) {
          product.stock = Math.max(0, product.stock - refund.quantityRefunded);
          await product.save({ session });
        }
      }
    }

    await Refund.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Refund deleted successfully. All changes have been reverted.',
    });
  } catch (error) {
    await session.abortTransaction();
    
    res.status(500).json({
      success: false,
      message: 'Error deleting refund',
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get refund statistics
// @route   GET /api/refunds/stats/overview
// @access  Private
const getRefundStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Total refunds
    const totalRefunds = await Refund.countDocuments(dateFilter);

    // Refunds by status
    const pendingRefunds = await Refund.countDocuments({
      ...dateFilter,
      status: 'pending',
    });

    const approvedRefunds = await Refund.countDocuments({
      ...dateFilter,
      status: 'approved',
    });

    const completedRefunds = await Refund.countDocuments({
      ...dateFilter,
      status: 'completed',
    });

    const rejectedRefunds = await Refund.countDocuments({
      ...dateFilter,
      status: 'rejected',
    });

    // Total refund amount
    const refundAmountData = await Refund.aggregate([
      { $match: { ...dateFilter, status: { $in: ['approved', 'completed'] } } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$refundAmount' },
        },
      },
    ]);

    const totalRefundAmount = refundAmountData.length > 0 ? refundAmountData[0].totalAmount : 0;

    // Refunds by reason
    const refundsByReason = await Refund.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 },
          totalAmount: { $sum: '$refundAmount' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Most refunded products
    const topRefundedProducts = await Refund.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$product',
          model: { $first: '$model' },
          totalQuantity: { $sum: '$quantityRefunded' },
          totalAmount: { $sum: '$refundAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalRefunds,
        pendingRefunds,
        approvedRefunds,
        completedRefunds,
        rejectedRefunds,
        totalRefundAmount: totalRefundAmount.toFixed(2),
        refundsByReason,
        topRefundedProducts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching refund statistics',
      error: error.message,
    });
  }
};

export {
  getRefunds,
  getRefund,
  createRefund,
  approveRefund,
  rejectRefund,
  completeRefund,
  deleteRefund,
  getRefundStats,
};
