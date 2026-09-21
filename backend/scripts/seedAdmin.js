import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../models/userModel.js';

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@unicornevbikes.com' });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      username: 'Admin',
      email: 'admin@unicornevbikes.com',
      password: 'admin123', // Will be hashed by pre-save middleware
      role: 'admin',
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@unicornevbikes.com');
    console.log('Password: admin123');
    console.log('\n⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
