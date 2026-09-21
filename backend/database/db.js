import mongoose from "mongoose";
import logger from "../utils/logger.js";

const MAX_RETRIES = 5;

const connectDB = async (retryCount = 0) => {
    try {
        // Log connection attempt (without exposing password)
        const sanitizedUri = process.env.MONGO_URI 
            ? process.env.MONGO_URI.replace(/:[^:@]+@/, ':****@')
            : 'NOT SET';
        logger.info('Attempting MongoDB connection', { uri: sanitizedUri, attempt: retryCount + 1 });

        // Connect with improved timeout settings
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 8000,
            socketTimeoutMS: 45000
        });
        
        logger.info('MongoDB connected successfully', {
            host: mongoose.connection.host,
            name: mongoose.connection.name
        });

        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB runtime connection error', { error: err.message });
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected. Mongoose will attempt to reconnect...');
        });
        
    } catch (error) {
        logger.error('MongoDB connection error', { 
            error: error.message,
            code: error.code,
            name: error.name,
            attempt: retryCount + 1
        });

        if (retryCount < MAX_RETRIES) {
            const delay = Math.min(2000 * Math.pow(2, retryCount), 15000);
            logger.warn(`Retrying MongoDB connection in ${delay / 1000}s (Attempt ${retryCount + 2}/${MAX_RETRIES + 1})...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return connectDB(retryCount + 1);
        }

        console.error('FATAL: MongoDB connection failed after multiple attempts:', error.message);
        throw error;
    }
}

export default connectDB;