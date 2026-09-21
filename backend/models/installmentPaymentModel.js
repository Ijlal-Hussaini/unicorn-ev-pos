import mongoose from 'mongoose';

const installmentPaymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: [true, 'Payment ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    installmentPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Installment',
      required: [true, 'Installment plan reference is required'],
    },
    installmentNumber: {
      type: Number,
      required: [true, 'Installment number is required'],
      min: [1, 'Installment number must be at least 1'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Payment amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['Credit Card', 'Cash', 'Bank Transfer', 'Debit Card'],
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    status: {
      type: String,
      enum: ['paid', 'late', 'pending'],
      default: 'paid',
    },
    lateFee: {
      type: Number,
      default: 0,
      min: [0, 'Late fee cannot be negative'],
    },
    paymentVariance: {
      type: Number,
      default: 0,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for days late
installmentPaymentSchema.virtual('daysLate').get(function () {
  if (this.status !== 'late') return 0;
  const diff = this.paymentDate - this.dueDate;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
});

// Index for faster queries
installmentPaymentSchema.index({ installmentPlan: 1 });
installmentPaymentSchema.index({ paymentDate: -1 });
installmentPaymentSchema.index({ status: 1 });
installmentPaymentSchema.index({ createdAt: -1 });

const InstallmentPayment = mongoose.model('InstallmentPayment', installmentPaymentSchema);

export default InstallmentPayment;
