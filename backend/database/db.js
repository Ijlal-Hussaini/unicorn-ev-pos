import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async()=>{
    try {
        // Desktop-only fallback for TLS issues
        if (process.env.ELECTRON_APP === 'true') {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
            logger.info('TLS verification disabled for Electron app');
        }

        // Log connection attempt (without exposing password)
        const sanitizedUri = process.env.MONGO_URI 
            ? process.env.MONGO_URI.replace(/:[^:@]+@/, ':****@')
            : 'NOT SET';
        logger.info('Attempting MongoDB connection', { uri: sanitizedUri });

        // Connect with improved timeout settings
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        
        logger.info('MongoDB connected successfully', {
            host: mongoose.connection.host,
            name: mongoose.connection.name
        });
        
    } catch (error) {
        logger.error('MongoDB connection error', { 
            error: error.message,
            code: error.code,
            name: error.name
        });
        console.error('FATAL: MongoDB connection failed:', error.message);
        process.exit(1);
    }
}

export default connectDB;