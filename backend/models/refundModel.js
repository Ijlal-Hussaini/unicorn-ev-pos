import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema(
  {
    refundId: {
      type: String,
      required: [true, 'Refund ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sales',
      required: [true, 'Original sale reference is required'],
    },
    invoiceId: {
      type: String,
      required: [true, 'Original invoice ID is required'],
      trim: true,
      uppercase: true,
    },
    customer: {
      type: String,
      required: [true, 'Customer name is required'],
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
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    model: {
      type: String,
      required: [true, 'Model name is required'],
    },
    quantityRefunded: {
      type: Number,
      required: [true, 'Refund quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    originalQuantity: {
      type: Number,
      required: [true, 'Original quantity is required'],
    },
    pricePerUnit: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0, 'Price cannot be negative'],
    },
    refundAmount: {
      type: Number,
      required: [true, 'Refund amount is required'],
      min: [0, 'Refund amount cannot be negative'],
    },
    originalTotal: {
      type: Number,
      required: [true, 'Original total is required'],
    },
    refundMethod: {
      type: String,
      required: [true, 'Refund method is required'],
      enum: ['Credit Card', 'Cash', 'Bank Transfer', 'Debit Card', 'Store Credit'],
    },
    reason: {
      type: String,
      required: [true, 'Refund reason is required'],
      enum: [
        'Defective Product',
        'Wrong Product',
        'Customer Changed Mind',
        'Product Not as Described',
        'Damaged During Delivery',
        'Other',
      ],
    },
    reasonDetails: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    restockProduct: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for refund percentage
refundSchema.virtual('refundPercentage').get(function () {
  if (this.originalTotal === 0) return 0;
  return ((this.refundAmount / this.originalTotal) * 100).toFixed(2);
});

// Index for faster queries
refundSchema.index({ customer: 1 });
refundSchema.index({ status: 1 });
refundSchema.index({ createdAt: -1 });
refundSchema.index({ processedBy: 1 });
refundSchema.index({ sale: 1 });
refundSchema.index({ invoiceId: 1 });

const Refund = mongoose.model('Refund', refundSchema);

export default Refund;
