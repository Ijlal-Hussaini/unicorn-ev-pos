import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Sales from '../models/salesModel.js';
import Refund from '../models/refundModel.js';

// Load environment variables
dotenv.config();

const updateRefundedSales = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all approved/completed refunds
    const refunds = await Refund.find({
      status: { $in: ['approved', 'completed'] }
    }).populate('sale');

    console.log(`\n📊 Found ${refunds.length} approved/completed refunds`);

    // Group refunds by sale
    const refundsBySale = {};
    for (const refund of refunds) {
      const saleId = refund.sale._id.toString();
      if (!refundsBySale[saleId]) {
        refundsBySale[saleId] = {
          sale: refund.sale,
          refunds: []
        };
      }
      refundsBySale[saleId].refunds.push(refund);
    }

    console.log(`\n🔄 Processing ${Object.keys(refundsBySale).length} sales with refunds...\n`);

    let updatedCount = 0;
    let alreadyCorrect = 0;

    // Update each sale
    for (const [saleId, data] of Object.entries(refundsBySale)) {
      const sale = data.sale;
      const saleRefunds = data.refunds;

      // Calculate total refunded
      const totalRefundedQuantity = saleRefunds.reduce((sum, r) => sum + r.quantityRefunded, 0);
      const totalRefundedAmount = saleRefunds.reduce((sum, r) => sum + r.refundAmount, 0);

      // Check if sale needs updating
      const needsUpdate = 
        sale.refundedQuantity !== totalRefundedQuantity ||
        sale.refundedAmount !== totalRefundedAmount ||
        (totalRefundedQuantity >= sale.quantity && sale.status !== 'refunded') ||
        (totalRefundedQuantity >= sale.quantity && !sale.isFullyRefunded) ||
        (totalRefundedQuantity > 0 && totalRefundedQuantity < sale.quantity && !sale.isPartiallyRefunded);

      if (needsUpdate) {
        // Update the sale
        sale.refundedQuantity = totalRefundedQuantity;
        sale.refundedAmount = totalRefundedAmount;

        if (totalRefundedQuantity >= sale.quantity) {
          sale.isFullyRefunded = true;
          sale.isPartiallyRefunded = false;
          sale.status = 'refunded';
          console.log(`✅ Updated ${sale.invoiceId}: FULLY REFUNDED (${totalRefundedQuantity}/${sale.quantity} units, Rs ${totalRefundedAmount})`);
        } else if (totalRefundedQuantity > 0) {
          sale.isPartiallyRefunded = true;
          sale.isFullyRefunded = false;
          console.log(`✅ Updated ${sale.invoiceId}: PARTIALLY REFUNDED (${totalRefundedQuantity}/${sale.quantity} units, Rs ${totalRefundedAmount})`);
        }

        await sale.save();
        updatedCount++;
      } else {
        alreadyCorrect++;
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   - Updated: ${updatedCount} sales`);
    console.log(`   - Already correct: ${alreadyCorrect} sales`);
    console.log(`   - Total processed: ${Object.keys(refundsBySale).length} sales`);

    // Show some statistics
    const fullyRefundedCount = await Sales.countDocuments({ isFullyRefunded: true });
    const partiallyRefundedCount = await Sales.countDocuments({ isPartiallyRefunded: true });
    const refundedStatusCount = await Sales.countDocuments({ status: 'refunded' });

    console.log(`\n📊 Current Database State:`);
    console.log(`   - Fully refunded sales: ${fullyRefundedCount}`);
    console.log(`   - Partially refunded sales: ${partiallyRefundedCount}`);
    console.log(`   - Sales with "refunded" status: ${refundedStatusCount}`);

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating refunded sales:', error);
    process.exit(1);
  }
};

// Run the migration
updateRefundedSales();
