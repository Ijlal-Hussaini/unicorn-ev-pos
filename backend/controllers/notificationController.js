import Product from '../models/productModel.js';
import Sales from '../models/salesModel.js';
import Installment from '../models/installmentModel.js';
import Refund from '../models/refundModel.js';

// @desc    Get aggregated dashboard notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const [outOfStock, lowStock, dueInstallments, pendingRefunds, recentSales] = await Promise.all([
      Product.find({ stock: 0 }).select('name model stock sku').limit(5).lean(),
      Product.find({ stock: { $gt: 0, $lte: 10 } }).select('name model stock sku').limit(5).lean(),
      Installment.find({
        status: 'active',
        nextDueDate: { $lte: threeDaysLater },
      }).select('installmentPlanId customer customerPhone nextDueDate remainingAmount installmentAmount').limit(5).lean(),
      Refund.find({ status: 'pending' }).select('refundId customer refundAmount reason createdAt').limit(5).lean(),
      Sales.find({ status: 'completed' }).sort({ createdAt: -1 }).select('invoiceId customer total createdAt').limit(3).lean(),
    ]);

    const notifications = [];

    // Out of stock notifications
    outOfStock.forEach(item => {
      notifications.push({
        id: `out-${item._id}`,
        type: 'out-of-stock',
        title: 'Out of Stock Alert',
        message: `${item.name || item.model || item.sku} - 0 units remaining`,
        time: 'Critical',
        unread: true,
        link: '/inventory',
      });
    });

    // Low stock notifications
    lowStock.forEach(item => {
      notifications.push({
        id: `low-${item._id}`,
        type: 'low-stock',
        title: 'Low Stock Warning',
        message: `${item.name || item.model || item.sku} - Only ${item.stock} left in showroom`,
        time: 'Warning',
        unread: true,
        link: '/inventory',
      });
    });

    // Installment due / overdue notifications
    dueInstallments.forEach(item => {
      const isOverdue = new Date(item.nextDueDate) < today;
      notifications.push({
        id: `inst-${item._id}`,
        type: isOverdue ? 'installment-overdue' : 'installment-due',
        title: isOverdue ? 'Installment Overdue' : 'Installment Due Soon',
        message: `${item.customer} - Rs. ${item.installmentAmount?.toLocaleString() || item.remainingAmount?.toLocaleString()} due on ${new Date(item.nextDueDate).toLocaleDateString()}`,
        time: isOverdue ? 'Overdue' : 'Upcoming',
        unread: true,
        link: `/installments/${item._id}`,
      });
    });

    // Pending refund notifications
    pendingRefunds.forEach(item => {
      notifications.push({
        id: `ref-${item._id}`,
        type: 'refund-pending',
        title: 'Refund Approval Required',
        message: `${item.customer} requested refund of Rs. ${item.refundAmount?.toLocaleString()} (${item.reason})`,
        time: 'Action Required',
        unread: true,
        link: '/sales/refunds',
      });
    });

    // Recent sale notifications
    recentSales.forEach(item => {
      notifications.push({
        id: `sale-${item._id}`,
        type: 'sale-completed',
        title: 'Vehicle Sale Completed',
        message: `Invoice #${item.invoiceId} - ${item.customer} (Rs. ${item.total?.toLocaleString()})`,
        time: 'Recent',
        unread: false,
        link: '/sales/records',
      });
    });

    const unreadCount = notifications.filter(n => n.unread).length;

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message,
    });
  }
};
