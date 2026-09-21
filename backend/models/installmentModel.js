import mongoose from 'mongoose';

const installmentSchema = new mongoose.Schema(
  {
    installmentPlanId: {
      type: String,
      required: [true, 'Installment plan ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sales',
      required: [true, 'Sale reference is required'],
    },
    invoiceId: {
      type: String,
      required: [true, 'Invoice ID is required'],
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
      required: [true, 'Customer phone is required'],
      trim: true,
    },
    customerCNIC: {
      type: String,
      required: [true, 'Customer CNIC is required for installments'],
      trim: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    productName: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    downPayment: {
      type: Number,
      required: [true, 'Down payment is required'],
      min: [0, 'Down payment cannot be negative'],
    },
    remainingAmount: {
      type: Number,
      required: [true, 'Remaining amount is required'],
      min: [0, 'Remaining amount cannot be negative'],
    },
    gracePeriodDays: {
      type: Number,
      default: 3,
      min: [0, 'Grace period cannot be negative'],
    },
    numberOfInstallments: {
      type: Number,
      required: [true, 'Number of installments is required'],
      min: [2, 'Minimum 2 installments required'],
      max: [24, 'Maximum 24 installments allowed'],
    },
    installmentAmount: {
      type: Number,
      required: [true, 'Installment amount is required'],
      min: [0, 'Installment amount cannot be negative'],
    },
    lastInstallmentAmount: {
      type: Number,
      min: [0, 'Last installment amount cannot be negative'],
    },
    accumulatedVariance: {
      type: Number,
      default: 0,
    },
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
      default: 'monthly',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'defaulted', 'cancelled'],
      default: 'active',
    },
    paidInstallments: {
      type: Number,
      default: 0,
      min: [0, 'Paid installments cannot be negative'],
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: [0, 'Total paid cannot be negative'],
    },
    nextDueDate: {
      type: Date,
      required: function() {
        // nextDueDate is only required for active plans
        return this.status === 'active';
      },
    },
    lastPaymentDate: {
      type: Date,
    },
    createdBy: {
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

// Virtual for remaining installments
installmentSchema.virtual('remainingInstallments').get(function () {
  return this.numberOfInstallments - this.paidInstallments;
});

// Virtual for completion percentage
installmentSchema.virtual('completionPercentage').get(function () {
  return ((this.paidInstallments / this.numberOfInstallments) * 100).toFixed(2);
});

// Virtual for is overdue (with grace period)
installmentSchema.virtual('isOverdue').get(function () {
  if (this.status !== 'active' || !this.nextDueDate) return false;
  const gracePeriodEnd = new Date(this.nextDueDate);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + (this.gracePeriodDays || 0));
  return new Date() > gracePeriodEnd;
});

// Virtual for days overdue
installmentSchema.virtual('daysOverdue').get(function () {
  if (!this.isOverdue) return 0;
  const diff = new Date() - this.nextDueDate;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Method to calculate next due date
installmentSchema.methods.calculateNextDueDate = function () {
  const currentDue = this.nextDueDate || this.startDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Start from the later of current due date or today to avoid past dates
  const baseDate = new Date(currentDue) > today ? new Date(currentDue) : today;
  const nextDue = new Date(baseDate);
  
  switch (this.frequency) {
    case 'weekly':
      nextDue.setDate(nextDue.getDate() + 7);
      break;
    case 'biweekly':
      nextDue.setDate(nextDue.getDate() + 14);
      break;
    case 'monthly':
      nextDue.setMonth(nextDue.getMonth() + 1);
      break;
  }
  
  return nextDue;
};

// Index for faster queries
installmentSchema.index({ customer: 1 });
installmentSchema.index({ status: 1 });
installmentSchema.index({ nextDueDate: 1 });
installmentSchema.index({ sale: 1 });
installmentSchema.index({ invoiceId: 1 });
installmentSchema.index({ createdAt: -1 });

const Installment = mongoose.model('Installment', installmentSchema);

export default Installment;
