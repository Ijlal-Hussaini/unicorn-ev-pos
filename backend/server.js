import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './database/db.js';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import refundRoutes from './routes/refundRoutes.js';
import installmentRoutes from './routes/installmentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import logger from './utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
// In production (Electron), this will be loaded by main.js, but we load it here as backup
if (process.env.NODE_ENV === 'production') {
    const envPath = path.join(__dirname, '.env.production');
    console.log('Loading .env.production from:', envPath);
    const result = dotenv.config({ path: envPath });
    if (result.error) {
        console.error('Error loading .env.production:', result.error.message);
    } else {
        console.log('.env.production loaded successfully');
    }
} else {
    dotenv.config();
}

const app = express();

const PORT = process.env.PORT || 3000;

// CORS configuration for Electron app
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Electron, mobile apps, curl)
      if (!origin) return callback(null, true);
      
      // Allow localhost on any port
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      
      // Allow file protocol for Electron production builds
      if (origin.startsWith('file://')) {
        return callback(null, true);
      }
      
      // Reject other origins
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/installments', installmentRoutes);
app.use('/api/notifications', notificationRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// 404 handler
app.use((req, res) => {
  logger.warn('404 - Route not found', { method: req.method, url: req.url });
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    url: req.url,
    method: req.method 
  });
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('Backend Server Starting...');
  console.log('='.repeat(60));
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Port:', PORT);
  console.log('MongoDB URI:', process.env.MONGO_URI ? 'Set ✓' : 'NOT SET ✗');
  console.log('JWT Secret:', process.env.JWT_SECRET ? 'Set ✓' : 'NOT SET ✗');
  console.log('Electron App:', process.env.ELECTRON_APP || 'false');
  console.log('='.repeat(60));
  
  connectDB().catch(err => {
    logger.error('Initial connectDB call encountered error', { error: err.message });
  });
  logger.info(`Server is listening at port ${PORT}`);
  logger.info('Environment check', {
    mongoUri: process.env.MONGO_URI ? 'Set' : 'NOT SET',
    mailUser: process.env.MAIL_USER ? 'Set' : 'NOT SET',
    mailPass: process.env.MAIL_PASS ? 'Set' : 'NOT SET',
    jwtSecret: process.env.JWT_SECRET ? 'Set' : 'NOT SET',
  });
});