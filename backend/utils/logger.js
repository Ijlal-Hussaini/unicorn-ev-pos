/**
 * Simple logging utility
 * In production, consider using winston or pino for more advanced logging
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

const shouldLog = (level) => {
  if (process.env.NODE_ENV === 'production') {
    // In production, only log errors and warnings
    return level === LOG_LEVELS.ERROR || level === LOG_LEVELS.WARN;
  }
  // In development, log everything
  return true;
};

const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
  return `[${timestamp}] [${level}] ${message} ${metaStr}`;
};

export const logger = {
  error: (message, meta = {}) => {
    if (shouldLog(LOG_LEVELS.ERROR)) {
      console.error(formatMessage(LOG_LEVELS.ERROR, message, meta));
    }
  },

  warn: (message, meta = {}) => {
    if (shouldLog(LOG_LEVELS.WARN)) {
      console.warn(formatMessage(LOG_LEVELS.WARN, message, meta));
    }
  },

  info: (message, meta = {}) => {
    if (shouldLog(LOG_LEVELS.INFO)) {
      console.log(formatMessage(LOG_LEVELS.INFO, message, meta));
    }
  },

  debug: (message, meta = {}) => {
    if (shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(formatMessage(LOG_LEVELS.DEBUG, message, meta));
    }
  },
};

export default logger;
