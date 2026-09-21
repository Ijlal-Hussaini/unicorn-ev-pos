import Sales from '../models/salesModel.js';

/**
 * Generate a unique invoice ID
 * Format: INV-YYYYMMDD-XXXX
 * Where XXXX is a sequential number for the day
 */
export const generateInvoiceId = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `INV-${year}${month}${day}`;

  // Find the last invoice for today
  const lastInvoice = await Sales.findOne({
    invoiceId: { $regex: `^${datePrefix}` }
  }).sort({ invoiceId: -1 });

  let sequenceNumber = 1;
  
  if (lastInvoice) {
    // Extract the sequence number from the last invoice
    const lastSequence = lastInvoice.invoiceId.split('-')[2];
    sequenceNumber = parseInt(lastSequence) + 1;
  }

  // Format sequence number with leading zeros (4 digits)
  const formattedSequence = String(sequenceNumber).padStart(4, '0');
  
  return `${datePrefix}-${formattedSequence}`;
};

/**
 * Validate invoice ID format
 */
export const validateInvoiceId = (invoiceId) => {
  const pattern = /^INV-\d{8}-\d{4}$/;
  return pattern.test(invoiceId);
};
