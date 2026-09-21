import Sales from '../models/salesModel.js';
import Product from '../models/productModel.js';
import Customer from '../models/customerModel.js';
import User from '../models/userModel.js';

// @desc    Get comprehensive dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    let previousStartDate = new Date();
    let previousEndDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(now.getDate() - 14);
        previousEndDate.setDate(now.getDate() - 7);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        previousStartDate.setFullYear(now.getFullYear() - 2);
        previousEndDate.setFullYear(now.getFullYear() - 1);
        break;
      default: // month
        startDate.setMonth(now.getMonth() - 1);
        previousStartDate.setMonth(now.getMonth() - 2);
        previousEndDate.setMonth(now.getMonth() - 1);
    }

    // Current period stats (with net revenue)
    const currentStats = await Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now },
          status: 'completed',
        },
      },
      {
        $addFields: {
          netRevenue: { $subtract: ['$total', { $ifNull: ['$refundedAmount', 0] }] },
          netQuantity: { $subtract: ['$quantity', { $ifNull: ['$refundedQuantity', 0] }] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$netRevenue' }, // Use net revenue
          totalSales: { $sum: 1 },
          totalProducts: { $sum: '$netQuantity' }, // Use net quantity
        },
      },
    ]);

    // Previous period stats for comparison (with net revenue)
    const previousStats = await Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: previousStartDate, $lte: previousEndDate },
          status: 'completed',
        },
      },
      {
        $addFields: {
          netRevenue: { $subtract: ['$total', { $ifNull: ['$refundedAmount', 0] }] },
          netQuantity: { $subtract: ['$quantity', { $ifNull: ['$refundedQuantity', 0] }] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$netRevenue' }, // Use net revenue
          totalSales: { $sum: 1 },
          totalProducts: { $sum: '$netQuantity' }, // Use net quantity
        },
      },
    ]);

    // New customers in current period
    const newCustomers = await Customer.countDocuments({
      createdAt: { $gte: startDate, $lte: now },
    });

    const previousNewCustomers = await Customer.countDocuments({
      createdAt: { $gte: previousStartDate, $lte: previousEndDate },
    });

    // Calculate percentage changes
    const current = currentStats[0] || { totalRevenue: 0, totalSales: 0, totalProducts: 0 };
    const previous = previousStats[0] || { totalRevenue: 0, totalSales: 0, totalProducts: 0 };

    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return (((current - previous) / previous) * 100).toFixed(1);
    };

    res.status(200).json({
      success: true,
      data: {
        revenue: {
          value: current.totalRevenue || 0,
          change: calculateChange(current.totalRevenue || 0, previous.totalRevenue || 0),
          trend: (current.totalRevenue || 0) >= (previous.totalRevenue || 0) ? 'up' : 'down',
        },
        sales: {
          value: current.totalSales || 0,
          change: calculateChange(current.totalSales || 0, previous.totalSales || 0),
          trend: (current.totalSales || 0) >= (previous.totalSales || 0) ? 'up' : 'down',
        },
        customers: {
          value: newCustomers,
          change: calculateChange(newCustomers, previousNewCustomers),
          trend: newCustomers >= previousNewCustomers ? 'up' : 'down',
        },
        products: {
          value: current.totalProducts || 0,
          change: calculateChange(current.totalProducts || 0, previous.totalProducts || 0),
          trend: (current.totalProducts || 0) >= (previous.totalProducts || 0) ? 'up' : 'down',
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message,
    });
  }
};

// @desc    Get monthly revenue trend
// @route   GET /api/reports/revenue-trend
// @access  Private
const getRevenueTrend = async (req, res) => {
  try {
    const { months = 6 } = req.query;

    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months));

    const trendData = await Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: monthsAgo },
          status: 'completed',
        },
      },
      {
        $addFields: {
          netRevenue: { $subtract: ['$total', { $ifNull: ['$refundedAmount', 0] }] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$netRevenue' }, // Use net revenue
          sales: { $sum: 1 },
          customers: { $addToSet: '$customer' },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          revenue: 1,
          sales: 1,
          customers: { $size: '$customers' },
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);

    // Format month names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedData = trendData.map((item) => ({
      month: monthNames[item.month - 1],
      revenue: item.revenue,
      sales: item.sales,
      customers: item.customers,
    }));

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue trend',
      error: error.message,
    });
  }
};

// @desc    Get sales by category
// @route   GET /api/reports/category-breakdown
// @access  Private
const getCategoryBreakdown = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const categoryData = await Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now },
          status: 'completed',
        },
      },
      {
        $addFields: {
          netRevenue: { $subtract: ['$total', { $ifNull: ['$refundedAmount', 0] }] }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.category',
          value: { $sum: '$netRevenue' }, // Use net revenue
          count: { $sum: 1 },
        },
      },
      { $sort: { value: -1 } },
    ]);

    // Calculate total and percentages
    const total = categoryData.reduce((sum, item) => sum + item.value, 0);
    const formattedData = categoryData.map((item) => ({
      category: item._id || 'Uncategorized',
      value: item.value,
      percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
      count: item.count,
    }));

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category breakdown',
      error: error.message,
    });
  }
};

// @desc    Get top performing products
// @route   GET /api/reports/top-products
// @access  Private
const getTopProducts = async (req, res) => {
  try {
    const { period = 'month', limit = 5 } = req.query;

    const now = new Date();
    let startDate = new Date();
    let previousStartDate = new Date();
    let previousEndDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(now.getDate() - 14);
        previousEndDate.setDate(now.getDate() - 7);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        previousStartDate.setFullYear(now.getFullYear() - 2);
        previousEndDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
        previousStartDate.setMonth(now.getMonth() - 2);
        previousEndDate.setMonth(now.getMonth() - 1);
    }

    // Current period top products (with net values)
    const currentTopProducts = await Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now },
          status: 'completed',
        },
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
          name: { $first: '$model' },
          sales: { $sum: '$netQuantity' }, // Use net quantity
          revenue: { $sum: '$netRevenue' }, // Use net revenue
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: parseInt(limit) },
    ]);

    // Get previous period data for growth calculation (with net revenue)
    const previousTopProducts = await Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: previousStartDate, $lte: previousEndDate },
          status: 'completed',
        },
      },
      {
        $addFields: {
          netRevenue: { $subtract: ['$total', { $ifNull: ['$refundedAmount', 0] }] }
        }
      },
      {
        $group: {
          _id: '$product',
          revenue: { $sum: '$netRevenue' }, // Use net revenue
        },
      },
    ]);

    // Create a map for previous revenue
    const previousRevenueMap = {};
    previousTopProducts.forEach((item) => {
      previousRevenueMap[item._id.toString()] = item.revenue || 0;
    });

    // Calculate growth
    const formattedData = currentTopProducts.map((item) => {
      const previousRevenue = previousRevenueMap[item._id.toString()] || 0;
      const growth = previousRevenue > 0 
        ? (((item.revenue - previousRevenue) / previousRevenue) * 100).toFixed(0)
        : item.revenue > 0 ? 100 : 0;

      return {
        name: item.name || 'Unknown',
        sales: item.sales || 0,
        revenue: item.revenue || 0,
        growth: growth >= 0 ? `+${growth}%` : `${growth}%`,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching top products',
      error: error.message,
    });
  }
};

// @desc    Generate and export report
// @route   GET /api/reports/export/:type
// @access  Private
const exportReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, format = 'json' } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    let reportData = {};

    switch (type) {
      case 'sales':
        reportData = await Sales.find({ ...dateFilter, status: 'completed' })
          .populate('product', 'sku model category')
          .populate('soldBy', 'username')
          .sort({ createdAt: -1 });
        break;

      case 'inventory':
        reportData = await Product.find()
          .select('sku name model category stock minStock price cost status')
          .sort({ stock: 1 });
        break;

      case 'customers':
        reportData = await Customer.find(dateFilter)
          .select('name email phone totalPurchases totalSpent createdAt')
          .sort({ totalSpent: -1 });
        break;

      case 'financial':
        const financialData = await Sales.aggregate([
          { $match: { ...dateFilter, status: 'completed' } },
          {
            $addFields: {
              netRevenue: { $subtract: ['$total', { $ifNull: ['$refundedAmount', 0] }] },
              netQuantity: { $subtract: ['$quantity', { $ifNull: ['$refundedQuantity', 0] }] }
            }
          },
          {
            $lookup: {
              from: 'products',
              localField: 'product',
              foreignField: '_id',
              as: 'productInfo',
            },
          },
          { $unwind: '$productInfo' },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$netRevenue' }, // Use net revenue
              totalCost: { $sum: { $multiply: ['$netQuantity', '$productInfo.cost'] } }, // Use net quantity
              totalSales: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              totalRevenue: 1,
              totalCost: 1,
              grossProfit: { $subtract: ['$totalRevenue', '$totalCost'] },
              profitMargin: {
                $multiply: [
                  { $divide: [{ $subtract: ['$totalRevenue', '$totalCost'] }, '$totalRevenue'] },
                  100,
                ],
              },
              totalSales: 1,
            },
          },
        ]);
        reportData = financialData[0] || {};
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type',
        });
    }

    res.status(200).json({
      success: true,
      reportType: type,
      generatedAt: new Date(),
      data: reportData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message,
    });
  }
};

// @desc    Get performance metrics
// @route   GET /api/reports/performance
// @access  Private
const getPerformanceMetrics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Sales performance (with net revenue)
    const salesMetrics = await Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now },
          status: 'completed',
        },
      },
      {
        $addFields: {
          netRevenue: { $subtract: ['$total', { $ifNull: ['$refundedAmount', 0] }] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$netRevenue' }, // Use net revenue
          totalSales: { $sum: 1 },
          avgOrderValue: { $avg: '$netRevenue' }, // Use net revenue
        },
      },
    ]);

    // Inventory metrics
    const inventoryMetrics = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          lowStockItems: {
            $sum: { $cond: [{ $eq: ['$status', 'low-stock'] }, 1, 0] },
          },
          outOfStockItems: {
            $sum: { $cond: [{ $eq: ['$status', 'out-of-stock'] }, 1, 0] },
          },
          totalInventoryValue: { $sum: { $multiply: ['$stock', '$cost'] } },
        },
      },
    ]);

    // Customer metrics
    const customerMetrics = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          avgSpending: { $avg: '$totalSpent' },
          totalSpent: { $sum: '$totalSpent' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        sales: salesMetrics[0] || {},
        inventory: inventoryMetrics[0] || {},
        customers: customerMetrics[0] || {},
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching performance metrics',
      error: error.message,
    });
  }
};

export {
  getDashboardStats,
  getRevenueTrend,
  getCategoryBreakdown,
  getTopProducts,
  exportReport,
  getPerformanceMetrics,
};
