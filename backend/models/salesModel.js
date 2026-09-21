import mongoose from 'mongoose';

const salesSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: String,
      required: [true, 'Invoice ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    customer: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerCnic: {
      type: String,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    customerAddress: {
      type: String,
      trim: true,
    },
    chassisNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    motorNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    batterySerial: {
      type: String,
      trim: true,
      uppercase: true,
    },
    color: {
      type: String,
      trim: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    model: {
      type: String,
      required: [true, 'Model name is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total cannot be negative'],
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['Credit Card', 'Cash', 'Bank Transfer', 'Debit Card', 'Installment'],
    },
    paymentType: {
      type: String,
      enum: ['full', 'installment'],
      default: 'full',
    },
    hasInstallmentPlan: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['completed', 'processing', 'pending', 'cancelled', 'refunded'],
      default: 'pending',
    },
    soldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    refundedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Refunded quantity cannot be negative'],
    },
    refundedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refunded amount cannot be negative'],
    },
    isPartiallyRefunded: {
      type: Boolean,
      default: false,
    },
    isFullyRefunded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for profit (using stored cost from time of sale, accounting for refunds)
salesSchema.virtual('profit').get(function () {
  const actualRevenue = this.total - this.refundedAmount;
  const actualCost = (this.quantity - this.refundedQuantity) * this.cost;
  return actualRevenue - actualCost;
});

// Virtual for profit margin percentage (accounting for refunds)
salesSchema.virtual('profitMargin').get(function () {
  const actualRevenue = this.total - this.refundedAmount;
  if (actualRevenue === 0) return 0;
  const actualCost = (this.quantity - this.refundedQuantity) * this.cost;
  return (((actualRevenue - actualCost) / actualRevenue) * 100).toFixed(2);
});

// Virtual for net revenue (after refunds)
salesSchema.virtual('netRevenue').get(function () {
  return this.total - this.refundedAmount;
});

// Virtual for net quantity (after refunds)
salesSchema.virtual('netQuantity').get(function () {
  return this.quantity - this.refundedQuantity;
});

// Pre-save middleware to calculate total
salesSchema.pre('save', function () {
  if (this.isModified('quantity') || this.isModified('price')) {
    this.total = this.quantity * this.price;
  }
});

// Index for faster queries
salesSchema.index({ customer: 1 });
salesSchema.index({ customerCnic: 1 });
salesSchema.index({ chassisNumber: 1 });
salesSchema.index({ status: 1 });
salesSchema.index({ createdAt: -1 });
salesSchema.index({ soldBy: 1 });
salesSchema.index({ paymentMethod: 1 });

const Sales = mongoose.model('Sales', salesSchema);

export default Sales;
