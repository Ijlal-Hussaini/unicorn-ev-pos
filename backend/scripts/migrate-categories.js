import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/productModel.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const migrateCategories = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully');

    // Find all products with old category names
    const productsToUpdate = await Product.find({
      category: { $nin: ['EV Bikes', 'Accessories'] }
    });

    console.log(`Found ${productsToUpdate.length} products to migrate`);

    if (productsToUpdate.length === 0) {
      console.log('No products need migration. All products already have valid categories.');
      await mongoose.connection.close();
      return;
    }

    // Update products based on their current category or characteristics
    let evBikesCount = 0;
    let accessoriesCount = 0;

    for (const product of productsToUpdate) {
      const oldCategory = product.category;
      
      // Determine new category based on old category name or product characteristics
      // If the product has specifications like motor, batteries, etc., it's likely an EV Bike
      const hasEVBikeSpecs = product.specifications && (
        product.specifications.motor ||
        product.specifications.batteries ||
        product.specifications.range ||
        product.specifications.maxSpeed
      );

      // Check if name/model suggests it's a bike
      const nameIndicatesBike = product.name?.toLowerCase().includes('bike') ||
                                product.name?.toLowerCase().includes('scooter') ||
                                product.model?.toLowerCase().includes('bike') ||
                                product.model?.toLowerCase().includes('scooter');

      // Determine new category
      let newCategory;
      if (hasEVBikeSpecs || nameIndicatesBike || oldCategory?.toLowerCase().includes('bike') || oldCategory?.toLowerCase().includes('electric')) {
        newCategory = 'EV Bikes';
        evBikesCount++;
      } else {
        newCategory = 'Accessories';
        accessoriesCount++;
      }

      // Update the product
      product.category = newCategory;
      await product.save();
      
      console.log(`Updated: ${product.name} (${product.sku}) - ${oldCategory} → ${newCategory}`);
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total products migrated: ${productsToUpdate.length}`);
    console.log(`Migrated to EV Bikes: ${evBikesCount}`);
    console.log(`Migrated to Accessories: ${accessoriesCount}`);
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
migrateCategories();
