import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Sales from '../models/salesModel.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const addRefundFieldsToSales = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully');

    // Find all sales that don't have refund fields
    const salesToUpdate = await Sales.find({
      $or: [
        { refundedQuantity: { $exists: false } },
        { refundedAmount: { $exists: false } },
        { isPartiallyRefunded: { $exists: false } },
        { isFullyRefunded: { $exists: false } }
      ]
    });

    console.log(`Found ${salesToUpdate.length} sales to update`);

    if (salesToUpdate.length === 0) {
      console.log('No sales need updating. All sales already have refund fields.');
      await mongoose.connection.close();
      return;
    }

    let updated = 0;
    for (const sale of salesToUpdate) {
      // Add refund fields with default values
      if (sale.refundedQuantity === undefined) sale.refundedQuantity = 0;
      if (sale.refundedAmount === undefined) sale.refundedAmount = 0;
      if (sale.isPartiallyRefunded === undefined) sale.isPartiallyRefunded = false;
      if (sale.isFullyRefunded === undefined) sale.isFullyRefunded = false;
      
      await sale.save();
      updated++;
      
      if (updated % 100 === 0) {
        console.log(`Updated ${updated} sales...`);
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total sales updated: ${updated}`);
    console.log(`All sales now have refund tracking fields`);
    console.log('=========================\n');

    console.log('Migration completed successfully!');
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
addRefundFieldsToSales();
