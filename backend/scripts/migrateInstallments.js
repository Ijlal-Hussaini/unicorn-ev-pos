import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Installment from '../models/installmentModel.js';
import InstallmentPayment from '../models/installmentPaymentModel.js';

// Load environment variables
dotenv.config();

const migrateInstallments = async () => {
  try {
    console.log('Starting installment migration...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update Installment plans with new fields
    const installmentResult = await Installment.updateMany(
      {
        $or: [
          { gracePeriodDays: { $exists: false } },
          { accumulatedVariance: { $exists: false } },
          { lastInstallmentAmount: { $exists: false } }
        ]
      },
      {
        $set: {
          gracePeriodDays: 3,
          accumulatedVariance: 0
        }
      }
    );
    
    console.log(`Updated ${installmentResult.modifiedCount} installment plans with new fields`);

    // Calculate and set lastInstallmentAmount for existing plans
    const plansWithoutLastAmount = await Installment.find({
      lastInstallmentAmount: { $exists: false }
    });
    
    let updatedPlans = 0;
    for (const plan of plansWithoutLastAmount) {
      const baseAmount = Math.floor(plan.remainingAmount / plan.numberOfInstallments);
      const remainder = plan.remainingAmount - (baseAmount * plan.numberOfInstallments);
      const lastInstallmentAmount = baseAmount + remainder;
      
      await Installment.updateOne(
        { _id: plan._id },
        { 
          $set: { 
            lastInstallmentAmount,
            installmentAmount: baseAmount // Update to use floor instead of ceil
          } 
        }
      );
      updatedPlans++;
    }
    
    console.log(`Calculated lastInstallmentAmount for ${updatedPlans} plans`);

    // Update InstallmentPayment records with new fields
    const paymentResult = await InstallmentPayment.updateMany(
      { paymentVariance: { $exists: false } },
      { $set: { paymentVariance: 0 } }
    );
    
    console.log(`Updated ${paymentResult.modifiedCount} payment records with new fields`);

    // Recalculate remainingAmount for all active plans
    const activePlans = await Installment.find({ status: 'active' });
    let recalculated = 0;
    
    for (const plan of activePlans) {
      const correctRemaining = plan.totalAmount - plan.totalPaid;
      if (plan.remainingAmount !== correctRemaining) {
        await Installment.updateOne(
          { _id: plan._id },
          { $set: { remainingAmount: correctRemaining } }
        );
        recalculated++;
      }
    }
    
    console.log(`Recalculated remainingAmount for ${recalculated} active plans`);

    console.log('\n✅ Migration completed successfully!');
    console.log('\nSummary:');
    console.log(`- Installment plans updated: ${installmentResult.modifiedCount}`);
    console.log(`- Last installment amounts calculated: ${updatedPlans}`);
    console.log(`- Payment records updated: ${paymentResult.modifiedCount}`);
    console.log(`- Remaining amounts recalculated: ${recalculated}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
migrateInstallments();
