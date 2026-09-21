import Installment from '../models/installmentModel.js';
import InstallmentPayment from '../models/installmentPaymentModel.js';
import Sales from '../models/salesModel.js';
import Product from '../models/productModel.js';
import { getSafeSession, commitSafeSession, abortSafeSession } from '../utils/transactionHelper.js';

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Generate installment plan ID
const generateInstallmentPlanId = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const count = await Installment.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });
    
    const sequence = String(count + 1 + attempts).padStart(4, '0');
    const planId = `INST-${year}${month}${day}-${sequence}`;
    
    const existing = await Installment.findOne({ installmentPlanId: planId });
    if (!existing) {
      return planId;
    }
    
    attempts++;
  }
  
  return `INST-${year}${month}${day}-${Date.now()}`;
};

// Generate payment ID
const generatePaymentId = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const count = await InstallmentPayment.countDocuments({
    createdAt: { 
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lte: new Date(date.setHours(23, 59, 59, 999))
    },
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  return `PAY-${year}${month}${day}-${sequence}`;
};

// Calculate installment schedule
const calculateInstallmentSchedule = (startDate, numberOfInstallments, frequency) => {
  const schedule = [];
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < numberOfInstallments; i++) {
    schedule.push(new Date(currentDate));
    
    switch (frequency) {
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }
  
  return schedule;
};

// @desc    Get all installment plans
// @route   GET /api/installments
// @access  Private
const getInstallmentPlans = async (req, res) => {
  try {
    const { status, customer, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (customer) {
      query.customer = { $regex: customer, $options: 'i' };
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    
    const plans = await Installment.find(query)
      .populate('product', 'sku model category name')
      .populate('sale', 'invoiceId')
      .populate('createdBy', 'username email')
      .sort(sortOptions);
    
    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching installment plans',
      error: error.message,
    });
  }
};

// @desc    Get single installment plan
// @route   GET /api/installments/:id
// @access  Private
const getInstallmentPlan = async (req, res) => {
  try {
    const plan = await Installment.findById(req.params.id)
      .populate('product', 'sku model category name price')
      .populate('sale', 'invoiceId total')
      .populate('createdBy', 'username email');
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Installment plan not found',
      });
    }
    
    // Get payment history
    const payments = await InstallmentPayment.find({ installmentPlan: plan._id })
      .populate('receivedBy', 'username')
      .sort({ installmentNumber: 1 });
    
    res.status(200).json({
      success: true,
      data: {
        plan,
        payments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching installment plan',
      error: error.message,
    });
  }
};

// @desc    Create installment plan
// @route   POST /api/installments
// @access  Private
const createInstallmentPlan = async (req, res) => {
  const session = await getSafeSession();
  
  try {
    const {
      saleId,
      customerCNIC,
      customerAddress,
      guarantors,
      downPayment,
      numberOfInstallments,
      frequency = 'monthly',
      startDate,
      notes,
    } = req.body;
    
    // Get sale details
    const sale = await Sales.findById(saleId)
      .populate('product')
      .session(session);
    
    if (!sale) {
      await abortSafeSession(session);
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }
    
    // Validate sale is eligible for installment (must have paymentType='installment')
    if (sale.paymentType !== 'installment') {
      await abortSafeSession(session);
      return res.status(400).json({
        success: false,
        message: 'This sale is not eligible for installment. Only sales with payment type "installment" can have installment plans.',
      });
    }
    
    // Validate sale doesn't already have installment plan
    const existingPlan = await Installment.findOne({ sale: saleId }).session(session);
    if (existingPlan) {
      await abortSafeSession(session);
      return res.status(400).json({
        success: false,
        message: 'This sale already has an installment plan',
      });
    }
    
    // Validate down payment
    if (downPayment < 0 || downPayment >= sale.total) {
      await abortSafeSession(session);
      return res.status(400).json({
        success: false,
        message: 'Down payment must be between 0 and total amount',
      });
    }
    
    // Validate start date is not in the past
    const planStartDate = startDate ? new Date(startDate) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    planStartDate.setHours(0, 0, 0, 0);
    
    if (planStartDate < today) {
      await abortSafeSession(session);
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past',
      });
    }
    
    // Calculate remaining amount and installment amounts
    const remainingAmount = sale.total - downPayment;
    
    // Calculate installment amount properly to avoid overpayment
    const baseInstallmentAmount = Math.floor(remainingAmount / numberOfInstallments);
    const remainder = remainingAmount - (baseInstallmentAmount * numberOfInstallments);
    
    // Regular installment amount (most installments will use this)
    const installmentAmount = baseInstallmentAmount;
    
    // Last installment includes any remainder to ensure exact total
    const lastInstallmentAmount = baseInstallmentAmount + remainder;
    
    // Calculate dates
    const schedule = calculateInstallmentSchedule(planStartDate, numberOfInstallments, frequency);
    const endDate = schedule[schedule.length - 1];
    
    // Generate plan ID
    const installmentPlanId = await generateInstallmentPlanId();
    
    // Create installment plan
    const plan = await Installment.create([{
      installmentPlanId,
      sale: saleId,
      invoiceId: sale.invoiceId,
      customer: sale.customer,
      customerEmail: sale.customerEmail,
      customerPhone: sale.customerPhone,
      customerCNIC,
      customerAddress: customerAddress || sale.customerAddress,
      guarantors: Array.isArray(guarantors) ? guarantors : [],
      product: sale.product._id,
      productName: sale.product.name,
      totalAmount: sale.total,
      downPayment,
      remainingAmount,
      numberOfInstallments,
      installmentAmount,
      lastInstallmentAmount, // Store the last installment amount
      frequency,
      startDate: planStartDate,
      endDate,
      nextDueDate: schedule[0],
      totalPaid: downPayment,
      paidInstallments: 0,
      status: 'active',
      createdBy: req.user._id,
      notes,
    }], { session });
    
    // Update sale to mark as installment
    sale.paymentMethod = 'Installment';
    sale.paymentType = 'installment';
    sale.hasInstallmentPlan = true;
    await sale.save({ session });
    
    await commitSafeSession(session);
    
    const populatedPlan = await Installment.findById(plan[0]._id)
      .populate('product', 'sku model category name')
      .populate('sale', 'invoiceId')
      .populate('createdBy', 'username email');
    
    res.status(201).json({
      success: true,
      message: 'Installment plan created successfully',
      data: populatedPlan,
    });
  } catch (error) {
    await abortSafeSession(session);
    
    res.status(400).json({
      success: false,
      message: 'Error creating installment plan',
      error: error.message,
    });
  }
};

// @desc    Record installment payment
// @route   POST /api/installments/:id/payment
// @access  Private
const recordPayment = async (req, res) => {
  const session = await getSafeSession();
  
  try {
    const { amount, paymentMethod, notes } = req.body;
    
    const plan = await Installment.findById(req.params.id).session(session);
    
    if (!plan) {
      await abortSafeSession(session);
      return res.status(404).json({
        success: false,
        message: 'Installment plan not found',
      });
    }
    
    if (plan.status !== 'active') {
      await abortSafeSession(session);
      return res.status(400).json({
        success: false,
        message: `Cannot record payment for ${plan.status} plan`,
      });
    }
    
    if (plan.paidInstallments >= plan.numberOfInstallments) {
      await abortSafeSession(session);
      return res.status(400).json({
        success: false,
        message: 'All installments have been paid',
      });
    }
    
    // Determine expected amount (use lastInstallmentAmount for final payment)
    const isLastInstallment = plan.paidInstallments + 1 === plan.numberOfInstallments;
    const expectedAmount = isLastInstallment && plan.lastInstallmentAmount 
      ? plan.lastInstallmentAmount 
      : plan.installmentAmount;
    
    // Validate amount - allow 5% variance for flexibility
    const minAmount = expectedAmount * 0.95;
    const maxAmount = expectedAmount * 1.1; // Allow 10% overpayment
    
    if (amount < minAmount) {
      await abortSafeSession(session);
      return res.status(400).json({
        success: false,
        message: `Payment amount too low. Expected: ${formatCurrency(expectedAmount)}, Minimum: ${formatCurrency(minAmount)}`,
      });
    }
    
    if (amount > maxAmount) {
      await abortSafeSession(session);
      return res.status(400).json({
        success: false,
        message: `Payment amount too high. Expected: ${formatCurrency(expectedAmount)}, Maximum: ${formatCurrency(maxAmount)}`,
      });
    }
    
    // Calculate payment shortfall or overpayment
    const paymentVariance = amount - expectedAmount;
    
    // Check if payment is late (considering grace period)
    const gracePeriodEnd = new Date(plan.nextDueDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + (plan.gracePeriodDays || 0));
    const isLate = new Date() > gracePeriodEnd;
    
    // Calculate late fee if applicable
    let lateFee = 0;
    if (isLate) {
      const daysLate = Math.floor((new Date() - gracePeriodEnd) / (1000 * 60 * 60 * 24));
      lateFee = Math.min(1000, expectedAmount * 0.05 * Math.ceil(daysLate / 7)); // 5% per week, max Rs. 1000
    }
    
    // Generate payment ID
    const paymentId = await generatePaymentId();
    
    // Record payment
    const payment = await InstallmentPayment.create([{
      paymentId,
      installmentPlan: plan._id,
      installmentNumber: plan.paidInstallments + 1,
      amount,
      paymentMethod,
      paymentDate: new Date(),
      dueDate: plan.nextDueDate,
      status: isLate ? 'late' : 'paid',
      lateFee,
      paymentVariance, // Track overpayment or underpayment
      receivedBy: req.user._id,
      notes,
    }], { session });
    
    // Update installment plan
    plan.paidInstallments += 1;
    plan.totalPaid += amount;
    plan.remainingAmount = Math.max(0, plan.totalAmount - plan.totalPaid); // Update remaining amount
    plan.lastPaymentDate = new Date();
    
    // Track accumulated variance
    if (!plan.accumulatedVariance) plan.accumulatedVariance = 0;
    plan.accumulatedVariance += paymentVariance;
    
    // Check if completed
    if (plan.paidInstallments >= plan.numberOfInstallments) {
      plan.status = 'completed';
      plan.nextDueDate = null;
    } else {
      plan.nextDueDate = plan.calculateNextDueDate();
    }
    
    await plan.save({ session });
    
    await commitSafeSession(session);
    
    const populatedPayment = await InstallmentPayment.findById(payment[0]._id)
      .populate('installmentPlan')
      .populate('receivedBy', 'username email');
    
    res.status(201).json({
      success: true,
      message: `Payment recorded successfully. ${plan.paidInstallments}/${plan.numberOfInstallments} installments paid.`,
      data: populatedPayment,
    });
  } catch (error) {
    await abortSafeSession(session);
    
    res.status(400).json({
      success: false,
      message: 'Error recording payment',
      error: error.message,
    });
  }
};

// @desc    Get payment history for plan
// @route   GET /api/installments/:id/payments
// @access  Private
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await InstallmentPayment.find({ installmentPlan: req.params.id })
      .populate('receivedBy', 'username email')
      .sort({ installmentNumber: 1 });
    
    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: error.message,
    });
  }
};

// @desc    Mark plan as defaulted
// @route   PUT /api/installments/:id/default
// @access  Private (Manager/Admin)
const markAsDefaulted = async (req, res) => {
  try {
    const { notes } = req.body;
    
    const plan = await Installment.findById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Installment plan not found',
      });
    }
    
    if (plan.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark ${plan.status} plan as defaulted`,
      });
    }
    
    plan.status = 'defaulted';
    if (notes) {
      plan.notes = plan.notes 
        ? `${plan.notes}\n\n[DEFAULTED]: ${notes}` 
        : `[DEFAULTED]: ${notes}`;
    }
    await plan.save();
    
    res.status(200).json({
      success: true,
      message: 'Installment plan marked as defaulted',
      data: plan,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error marking plan as defaulted',
      error: error.message,
    });
  }
};

// @desc    Cancel installment plan
// @route   PUT /api/installments/:id/cancel
// @access  Private (Manager/Admin)
const cancelInstallmentPlan = async (req, res) => {
  try {
    const { notes } = req.body;
    
    const plan = await Installment.findById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Installment plan not found',
      });
    }
    
    if (plan.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ${plan.status} plan`,
      });
    }
    
    plan.status = 'cancelled';
    if (notes) {
      plan.notes = plan.notes 
        ? `${plan.notes}\n\n[CANCELLED]: ${notes}` 
        : `[CANCELLED]: ${notes}`;
    }
    await plan.save();
    
    res.status(200).json({
      success: true,
      message: 'Installment plan cancelled',
      data: plan,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error cancelling plan',
      error: error.message,
    });
  }
};

// @desc    Get overdue installments
// @route   GET /api/installments/overdue
// @access  Private
const getOverdueInstallments = async (req, res) => {
  try {
    const overduePlans = await Installment.find({
      status: 'active',
      nextDueDate: { $lt: new Date() },
    })
      .populate('product', 'name model')
      .populate('createdBy', 'username')
      .sort({ nextDueDate: 1 });
    
    res.status(200).json({
      success: true,
      count: overduePlans.length,
      data: overduePlans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching overdue installments',
      error: error.message,
    });
  }
};

// @desc    Get installment statistics
// @route   GET /api/installments/stats/overview
// @access  Private
const getInstallmentStats = async (req, res) => {
  try {
    const totalPlans = await Installment.countDocuments();
    const activePlans = await Installment.countDocuments({ status: 'active' });
    const completedPlans = await Installment.countDocuments({ status: 'completed' });
    const defaultedPlans = await Installment.countDocuments({ status: 'defaulted' });
    
    const overduePlans = await Installment.countDocuments({
      status: 'active',
      nextDueDate: { $lt: new Date() },
    });
    
    // Total amounts
    const amountData = await Installment.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$totalPaid' },
          totalRemaining: { $sum: '$remainingAmount' },
        },
      },
    ]);
    
    const amounts = amountData.length > 0 ? amountData[0] : {
      totalAmount: 0,
      totalPaid: 0,
      totalRemaining: 0,
    };
    
    res.status(200).json({
      success: true,
      data: {
        totalPlans,
        activePlans,
        completedPlans,
        defaultedPlans,
        overduePlans,
        totalAmount: amounts.totalAmount.toFixed(2),
        totalPaid: amounts.totalPaid.toFixed(2),
        totalRemaining: amounts.totalRemaining.toFixed(2),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message,
    });
  }
};

// @desc    Update installment plan guarantors / KYC
// @route   PUT /api/installments/:id/guarantors
// @access  Private (Admin/Manager)
const updateGuarantors = async (req, res) => {
  try {
    const { guarantors, customerCNIC, customerAddress } = req.body;
    const plan = await Installment.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Installment plan not found',
      });
    }

    if (Array.isArray(guarantors)) {
      plan.guarantors = guarantors;
    }
    if (customerCNIC) plan.customerCNIC = customerCNIC;
    if (customerAddress) plan.customerAddress = customerAddress;

    await plan.save();

    res.status(200).json({
      success: true,
      message: 'Guarantor KYC updated successfully',
      data: plan,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating guarantors',
      error: error.message,
    });
  }
};

export {
  getInstallmentPlans,
  getInstallmentPlan,
  createInstallmentPlan,
  recordPayment,
  getPaymentHistory,
  markAsDefaulted,
  cancelInstallmentPlan,
  getOverdueInstallments,
  getInstallmentStats,
  updateGuarantors,
};
