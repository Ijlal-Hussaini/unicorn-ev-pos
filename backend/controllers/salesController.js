import Sales from '../models/salesModel.js';
import Product from '../models/productModel.js';
import { generateInvoiceId } from '../utils/invoiceGenerator.js';

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res) => {
  try {
    const {
      status,
      customer,
      paymentMethod,
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

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
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

    const sales = await Sales.find(query)
      .populate('product', 'sku model category')
      .populate('soldBy', 'username email')
      .sort(sortOptions);

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sales',
      error: error.message,
    });
  }
};

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
const getSale = async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id)
      .populate('product', 'sku model category cost')
      .populate('soldBy', 'username email role');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }

    res.status(200).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sale',
      error: error.message,
    });
  }
};

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private
const createSale = async (req, res) => {
  // Start a session for transaction
  const session = await Sales.startSession();
  
  try {
    let {
      invoiceId,
      customer,
      customerEmail,
      customerPhone,
      productId,
      quantity,
      paymentMethod,
      paymentType,
      status,
      notes,
    } = req.body;

    // Auto-generate invoice ID if not provided
    if (!invoiceId) {
      invoiceId = await generateInvoiceId();
    }

    // Validate quantity
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1',
      });
    }

    // Start transaction
    await session.startTransaction();

    // Check if invoice ID already exists
    const existingSale = await Sales.findOne({ invoiceId }).session(session);
    if (existingSale) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Invoice ID already exists',
      });
    }

    // Get product details with lock
    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check stock availability
    if (product.stock < quantity) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${product.stock}`,
      });
    }

    // Store product cost at time of sale for accurate profit calculation
    const productCost = product.cost;
    const salePrice = product.price;

    // Create sale
    const sale = await Sales.create([{
      invoiceId,
      customer,
      customerEmail,
      customerPhone,
      product: productId,
      model: product.model || product.name, // Use model if available, otherwise use name
      quantity,
      price: salePrice,
      cost: productCost, // Store cost at time of sale
      total: salePrice * quantity,
      paymentMethod,
      paymentType: paymentType || 'full',
      status: status || 'pending',
      soldBy: req.user._id,
      notes,
    }], { session });

    // Update product stock if sale is completed
    if (status === 'completed') {
      product.stock -= quantity;
      await product.save({ session });
    }

    // Commit transaction
    await session.commitTransaction();

    // Populate the sale data
    const populatedSale = await Sales.findById(sale[0]._id)
      .populate('product', 'sku model category')
      .populate('soldBy', 'username email');

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: populatedSale,
    });
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    
    res.status(400).json({
      success: false,
      message: 'Error creating sale',
      error: error.message,
    });
  } finally {
    // End session
    session.endSession();
  }
};

// @desc    Update sale
// @route   PUT /api/sales/:id
// @access  Private
const updateSale = async (req, res) => {
  const session = await Sales.startSession();
  
  try {
    await session.startTransaction();

    const sale = await Sales.findById(req.params.id).session(session);

    if (!sale) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }

    const oldStatus = sale.status;
    const newStatus = req.body.status || oldStatus;
    const product = await Product.findById(sale.product).session(session);

    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Associated product not found',
      });
    }

    // Handle stock adjustments based on status changes
    if (oldStatus !== newStatus) {
      // From any status to completed: reduce stock
      if (oldStatus !== 'completed' && newStatus === 'completed') {
        if (product.stock < sale.quantity) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: `Insufficient stock. Available: ${product.stock}`,
          });
        }
        product.stock -= sale.quantity;
      }
      
      // From completed to any other status: restore stock
      if (oldStatus === 'completed' && newStatus !== 'completed') {
        product.stock += sale.quantity;
      }
      
      await product.save({ session });
    }

    // Update sale
    Object.assign(sale, req.body);
    await sale.save({ session });

    await session.commitTransaction();

    // Populate and return updated sale
    const updatedSale = await Sales.findById(sale._id)
      .populate('product', 'sku model category')
      .populate('soldBy', 'username email');

    res.status(200).json({
      success: true,
      message: 'Sale updated successfully',
      data: updatedSale,
    });
  } catch (error) {
    await session.abortTransaction();
    
    res.status(400).json({
      success: false,
      message: 'Error updating sale',
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// @desc    Delete sale
// @route   DELETE /api/sales/:id
// @access  Private (Admin)
const deleteSale = async (req, res) => {
  const session = await Sales.startSession();
  
  try {
    await session.startTransaction();

    const sale = await Sales.findById(req.params.id).session(session);

    if (!sale) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }

    // If sale was completed, restore stock
    if (sale.status === 'completed') {
      const product = await Product.findById(sale.product).session(session);
      if (product) {
        product.stock += sale.quantity;
        await product.save({ session });
      }
    }

    await Sales.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Sale deleted successfully',
    });
  } catch (error) {
    await session.abortTransaction();
    
    res.status(500).json({
      success: false,
      message: 'Error deleting sale',
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get sales statistics
// @route   GET /api/sales/stats/overview
// @access  Private
const getSalesStats = async (req, res) => {
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

    // Total sales and revenue (excluding fully refunded sales)
    const totalSales = await Sales.countDocuments({
      ...dateFilter,
      status: 'completed',
      isFullyRefunded: { $ne: true }, // Exclude fully refunded sales
    });

    const revenueData = await Sales.aggregate([
      { 
        $match: { 
          ...dateFilter, 
          status: { $in: ['completed', 'refunded'] } // Include both completed and refunded for calculation
        } 
      },
      {
        $addFields: {
          // Calculate net revenue (total - refunded amount)
          netRevenue: { $subtract: ['$total', { $ifNull: ['$refundedAmount', 0] }] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$netRevenue' }, // Use net revenue instead of total
          totalRefunded: { $sum: { $ifNull: ['$refundedAmount', 0] } },
        },
      },
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    const totalRefunded = revenueData.length > 0 ? revenueData[0].totalRefunded : 0;

    // Average order value (based on net revenue)
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Pending orders
    const pendingOrders = await Sales.countDocuments({
      ...dateFilter,
      status: 'pending',
    });

    // Sales by payment method (with net revenue)
    const salesByPayment = await Sales.aggregate([
      { 
        $match: { 
          ...dateFilter, 
          status: { $in: ['completed', 'refunded'] } // Include both for calculation
        } 
      },
      {
        $addFields: {
          netRevenue: { $subtract: ['$total', { $ifNull: ['$refundedAmount', 0] }] }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$netRevenue' }, // Use net revenue
        },
      },
    ]);

    // Top selling products (with net values)
    const topProducts = await Sales.aggregate([
      { 
        $match: { 
          ...dateFilter, 
          status: { $in: ['completed', 'refunded'] } // Include both for calculation
        } 
      },
      {
        $addFields: {
          netRevenue: { $subtract: ['$total', { $ifNull: ['$refundedAmount', 0] }] },
          netQuantity: { $subtract: ['$quantity', { $ifNull: ['$refundedQuantity', 0] }] }
        }
      },
      {
        $group: {
          _id: '$product',
          model: { $first: '$model' },
          totalQuantity: { $sum: '$netQuantity' }, // Use net quantity
          totalRevenue: { $sum: '$netRevenue' }, // Use net revenue
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSales,
        totalRevenue: totalRevenue.toFixed(2),
        totalRefunded: totalRefunded.toFixed(2), // Include refunded amount
        avgOrderValue: avgOrderValue.toFixed(2),
        pendingOrders,
        salesByPayment,
        topProducts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sales statistics',
      error: error.message,
    });
  }
};

// @desc    Get sales by date range (for charts)
// @route   GET /api/sales/stats/chart
// @access  Private
const getSalesChart = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

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

    // Group by format
    let dateFormat;
    switch (groupBy) {
      case 'month':
        dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
      case 'week':
        dateFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
        break;
      default:
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const chartData = await Sales.aggregate([
      { 
        $match: { 
          ...dateFilter, 
          status: { $in: ['completed', 'refunded'] } // Include both for calculation
        } 
      },
      {
        $addFields: {
          netRevenue: { $subtract: ['$total', { $ifNull: ['$refundedAmount', 0] }] }
        }
      },
      {
        $group: {
          _id: dateFormat,
          sales: { $sum: 1 },
          revenue: { $sum: '$netRevenue' }, // Use net revenue
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chart data',
      error: error.message,
    });
  }
};

export {
  getSales,
  getSale,
  createSale,
  updateSale,
  deleteSale,
  getSalesStats,
  getSalesChart,
};
