import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    address: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      zipCode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
        default: 'USA',
      },
    },
    purchaseHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sales',
      },
    ],
    totalPurchases: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for full address
customerSchema.virtual('fullAddress').get(function () {
  const { street, city, state, zipCode, country } = this.address;
  const parts = [street, city, state, zipCode, country].filter(Boolean);
  return parts.join(', ');
});

// Method to update purchase stats
customerSchema.methods.updatePurchaseStats = async function () {
  const Sales = mongoose.model('Sales');
  const sales = await Sales.find({
    _id: { $in: this.purchaseHistory },
    status: 'completed',
  });

  this.totalPurchases = sales.length;
  this.totalSpent = sales.reduce((sum, sale) => sum + sale.total, 0);

  return this;
};

// Index for faster queries
customerSchema.index({ phone: 1 });
customerSchema.index({ name: 1 });
customerSchema.index({ isActive: 1 });
customerSchema.index({ createdAt: -1 });
customerSchema.index({ totalSpent: -1 });

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
