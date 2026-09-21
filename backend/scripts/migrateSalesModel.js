/**
 * Migration Script: Add cost field to existing sales records
 * 
 * This script updates existing sales records to include the cost field
 * by looking up the current product cost. Run this once after deploying
 * the updated sales model.
 * 
 * Usage: node backend/scripts/migrateSalesModel.js
 */

import mongoose from 'mongoose';
import 'dotenv/config';
import Sales from '../models/salesModel.js';
import Product from '../models/productModel.js';

const migrateSales = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully');

    // Find all sales without cost field
    const salesWithoutCost = await Sales.find({ cost: { $exists: false } });
    console.log(`Found ${salesWithoutCost.length} sales records without cost field`);

    let updated = 0;
    let failed = 0;

    for (const sale of salesWithoutCost) {
      try {
        // Get the product to find its cost
        const product = await Product.findById(sale.product);
        
        if (product) {
          // Update sale with product cost
          sale.cost = product.cost;
          await sale.save();
          updated++;
          console.log(`✓ Updated sale ${sale.invoiceId} with cost ${product.cost}`);
        } else {
          // Product not found, use price as cost (0 profit)
          sale.cost = sale.price;
          await sale.save();
          failed++;
          console.log(`⚠ Product not found for sale ${sale.invoiceId}, using price as cost`);
        }
      } catch (error) {
        failed++;
        console.error(`✗ Failed to update sale ${sale.invoiceId}:`, error.message);
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Successfully updated: ${updated}`);
    console.log(`Failed/Warning: ${failed}`);
    console.log(`Total processed: ${salesWithoutCost.length}`);

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
migrateSales();
