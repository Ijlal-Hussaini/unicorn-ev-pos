import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['EV Bikes', 'Accessories'],
    trim: true,
    default: 'EV Bikes'
  },
  description: {
    type: String,
    trim: true
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  minStock: {
    type: Number,
    required: [true, 'Minimum stock level is required'],
    min: [0, 'Minimum stock cannot be negative'],
    default: 10
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  cost: {
    type: Number,
    required: [true, 'Cost is required'],
    min: [0, 'Cost cannot be negative']
  },
  supplier: {
    type: String,
    required: [true, 'Supplier is required'],
    trim: true
  },
  photos: {
    type: [String],
    default: []
  },
  // Specifications
  specifications: {
    maxSpeed: {
      type: String,
      trim: true
    },
    range: {
      type: String,
      trim: true
    },
    motor: {
      type: String,
      trim: true
    },
    controller: {
      type: String,
      trim: true
    },
    batteries: {
      type: String,
      trim: true
    },
    motorBatteryWarranty: {
      type: String,
      trim: true
    },
    brake: {
      type: String,
      trim: true
    },
    extraFeatures: {
      type: String,
      trim: true
    },
    tyre: {
      type: String,
      trim: true
    },
    suspension: {
      type: String,
      trim: true
    },
    charging: {
      type: String,
      trim: true
    },
    batteryType: {
      type: String,
      trim: true
    },
    chargingTime: {
      type: String,
      trim: true
    },
    modes: {
      type: String,
      trim: true
    }
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock'],
    default: function() {
      if (this.stock === 0) return 'out-of-stock';
      if (this.stock < this.minStock) return 'low-stock';
      return 'in-stock';
    }
  }
}, {
  timestamps: true
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  return this.price - this.cost;
});

// Virtual for profit percentage
productSchema.virtual('profitPercentage').get(function() {
  return ((this.price - this.cost) / this.cost * 100).toFixed(2);
});

// Method to update stock status
productSchema.methods.updateStatus = function() {
  if (this.stock === 0) {
    this.status = 'out-of-stock';
  } else if (this.stock < this.minStock) {
    this.status = 'low-stock';
  } else {
    this.status = 'in-stock';
  }
  return this.status;
};

// Pre-save middleware to auto-update status
productSchema.pre('save', function() {
  this.updateStatus();
});

// Index for faster queries
productSchema.index({ model: 1 });
productSchema.index({ status: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ category: 1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
