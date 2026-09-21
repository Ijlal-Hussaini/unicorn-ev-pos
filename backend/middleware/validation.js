// Input validation and sanitization middleware

// Sanitize string inputs to prevent NoSQL injection
export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remove any MongoDB operators
    return input.replace(/^\$/, '');
  }
  if (typeof input === 'object' && input !== null) {
    // If object is passed, reject it (prevents NoSQL injection)
    return null;
  }
  return input;
};

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// Validate phone number (basic validation)
export const validatePhone = (phone) => {
  // Allow various formats: +1234567890, 123-456-7890, (123) 456-7890, etc.
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

// Validate date is not in the future
export const validateNotFutureDate = (date) => {
  const inputDate = new Date(date);
  const now = new Date();
  return inputDate <= now;
};

// Validate positive number
export const validatePositiveNumber = (num) => {
  return typeof num === 'number' && num >= 0 && !isNaN(num);
};

// Validate positive integer
export const validatePositiveInteger = (num) => {
  return Number.isInteger(num) && num > 0;
};

// Middleware to sanitize request body
export const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      } else if (typeof req.body[key] === 'object' && req.body[key] !== null) {
        // For nested objects, sanitize recursively
        req.body[key] = sanitizeObjectRecursive(req.body[key]);
      }
    });
  }
  next();
};

// Recursively sanitize object
const sanitizeObjectRecursive = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => 
      typeof item === 'object' ? sanitizeObjectRecursive(item) : sanitizeInput(item)
    );
  }
  
  const sanitized = {};
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'string') {
      sanitized[key] = sanitizeInput(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitized[key] = sanitizeObjectRecursive(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  });
  return sanitized;
};

// Middleware to sanitize query parameters
export const sanitizeQuery = (req, res, next) => {
  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeInput(req.query[key]);
      }
    });
  }
  next();
};

// Validate sale creation data
export const validateSaleData = (req, res, next) => {
  const { quantity, productId, invoiceId, customer, paymentMethod, customerDetails } = req.body;

  const errors = [];

  // invoiceId is optional because salesController auto-generates if not provided
  if (invoiceId !== undefined && (typeof invoiceId !== 'string' || !invoiceId.trim())) {
    errors.push('Valid invoice ID must be a non-empty string');
  }

  if (!customer || typeof customer !== 'string') {
    errors.push('Customer name is required');
  }

  if (!productId || typeof productId !== 'string') {
    errors.push('Product ID is required');
  }

  if (!quantity || !validatePositiveInteger(quantity)) {
    errors.push('Quantity must be a positive integer');
  }

  if (!paymentMethod || typeof paymentMethod !== 'string') {
    errors.push('Payment method is required');
  }

  // Validate customerDetails if provided (optional but if present, validate structure)
  if (customerDetails && typeof customerDetails === 'object') {
    if (customerDetails.cnic && typeof customerDetails.cnic !== 'string') {
      errors.push('CNIC must be a string');
    }
    if (customerDetails.address && typeof customerDetails.address !== 'object') {
      errors.push('Address must be an object');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors,
    });
  }

  next();
};

// Validate product creation data
export const validateProductData = (req, res, next) => {
  // Support both cost and costPrice
  if (req.body.cost === undefined && req.body.costPrice !== undefined) {
    req.body.cost = req.body.costPrice;
  }
  // Default supplier if omitted
  if (!req.body.supplier || typeof req.body.supplier !== 'string' || !req.body.supplier.trim()) {
    req.body.supplier = 'Unicorn EV OEM';
  }

  const { sku, name, price, cost, stock, minStock, supplier, category } = req.body;

  const errors = [];

  if (!sku || typeof sku !== 'string') {
    errors.push('SKU is required');
  }

  if (!name || typeof name !== 'string') {
    errors.push('Product name is required');
  }

  if (!supplier || typeof supplier !== 'string') {
    errors.push('Supplier is required');
  }

  if (category && !['EV Bikes', 'Accessories'].includes(category)) {
    errors.push('Category must be either "EV Bikes" or "Accessories"');
  }

  if (price === undefined || !validatePositiveNumber(price)) {
    errors.push('Valid price is required');
  }

  if (cost === undefined || !validatePositiveNumber(cost)) {
    errors.push('Valid cost is required');
  }

  if (stock === undefined || !validatePositiveNumber(stock)) {
    errors.push('Valid stock quantity is required');
  }

  if (minStock === undefined || !validatePositiveNumber(minStock)) {
    errors.push('Valid minimum stock level is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors,
    });
  }

  next();
};

// Validate customer data
export const validateCustomerData = (req, res, next) => {
  const { name, email, phone } = req.body;

  const errors = [];

  if (!name || typeof name !== 'string') {
    errors.push('Customer name is required');
  }

  if (!email || !validateEmail(email)) {
    errors.push('Valid email address is required');
  }

  if (!phone || !validatePhone(phone)) {
    errors.push('Valid phone number is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors,
    });
  }

  next();
};

// Validate user registration data
export const validateUserData = (req, res, next) => {
  const { username, email, password } = req.body;

  const errors = [];

  if (!username || typeof username !== 'string' || username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }

  if (!email || !validateEmail(email)) {
    errors.push('Valid email address is required');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors,
    });
  }

  next();
};
