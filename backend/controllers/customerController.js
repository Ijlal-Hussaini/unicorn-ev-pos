import Customer from '../models/customerModel.js';
import Sales from '../models/salesModel.js';

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const { search, isActive, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Build query
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const customers = await Customer.find(query)
      .populate('addedBy', 'username email')
      .sort(sortOptions);

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message,
    });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('addedBy', 'username email')
      .populate({
        path: 'purchaseHistory',
        populate: {
          path: 'product',
          select: 'model sku',
        },
      });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message,
    });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;

    // Check if customer with email already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email already exists',
      });
    }

    const customer = await Customer.create({
      name,
      email,
      phone,
      address,
      notes,
      addedBy: req.user._id,
    });

    const populatedCustomer = await Customer.findById(customer._id).populate(
      'addedBy',
      'username email'
    );

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: populatedCustomer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating customer',
      error: error.message,
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Check if email is being updated and already exists
    if (req.body.email && req.body.email !== customer.email) {
      const existingEmail = await Customer.findOne({ email: req.body.email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate('addedBy', 'username email');

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating customer',
      error: error.message,
    });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private (Admin)
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    await Customer.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting customer',
      error: error.message,
    });
  }
};

// @desc    Get customer purchase history
// @route   GET /api/customers/:id/purchases
// @access  Private
const getCustomerPurchases = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const purchases = await Sales.find({
      _id: { $in: customer.purchaseHistory },
    })
      .populate('product', 'model sku category')
      .populate('soldBy', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase history',
      error: error.message,
    });
  }
};

// @desc    Add purchase to customer history
// @route   POST /api/customers/:id/purchases
// @access  Private
const addPurchaseToCustomer = async (req, res) => {
  try {
    const { saleId } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const sale = await Sales.findById(saleId);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }

    // Add to purchase history if not already there
    if (!customer.purchaseHistory.includes(saleId)) {
      customer.purchaseHistory.push(saleId);
      await customer.updatePurchaseStats();
      await customer.save();
    }

    res.status(200).json({
      success: true,
      message: 'Purchase added to customer history',
      data: customer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error adding purchase to customer',
      error: error.message,
    });
  }
};

// @desc    Get customer statistics
// @route   GET /api/customers/stats/overview
// @access  Private
const getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments({ isActive: true });
    const inactiveCustomers = await Customer.countDocuments({ isActive: false });

    // Top customers by spending
    const topCustomers = await Customer.find({ isActive: true })
      .sort({ totalSpent: -1 })
      .limit(10)
      .select('name email totalSpent totalPurchases');

    // Average customer value
    const avgCustomerValue = await Customer.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          avgSpent: { $avg: '$totalSpent' },
          avgPurchases: { $avg: '$totalPurchases' },
        },
      },
    ]);

    // New customers this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newCustomersThisMonth = await Customer.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        inactiveCustomers,
        newCustomersThisMonth,
        topCustomers,
        avgCustomerValue:
          avgCustomerValue.length > 0
            ? {
                avgSpent: avgCustomerValue[0].avgSpent.toFixed(2),
                avgPurchases: avgCustomerValue[0].avgPurchases.toFixed(2),
              }
            : { avgSpent: 0, avgPurchases: 0 },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customer statistics',
      error: error.message,
    });
  }
};

export {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerPurchases,
  addPurchaseToCustomer,
  getCustomerStats,
};
