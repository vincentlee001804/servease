/**
 * Structured logging utility for Firebase Cloud Functions
 * Logs are automatically sent to Google Cloud Logging
 * 
 * Usage:
 *   const logger = require('./utils/logger');
 *   logger.info('User logged in', { userId: '123', email: 'user@example.com' });
 *   logger.error('Failed to process payment', { error, orderId: '456' });
 */

const functions = require('firebase-functions');

// Log severity levels matching Google Cloud Logging
const Severity = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  NOTICE: 'NOTICE',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
  ALERT: 'ALERT',
  EMERGENCY: 'EMERGENCY'
};

/**
 * Determine user type from request context
 * @param {object} context - Log context
 * @returns {string} - 'vendor', 'customer', or 'anonymous'
 */
function determineUserType(context = {}) {
  // If user is authenticated and has role, it's a vendor
  if (context.userId || context.email) {
    // Check if it's a vendor (authenticated users are vendors)
    if (context.role === 'vendor' || context.userId || context.email) {
      return 'vendor';
    }
    return 'customer';
  }
  // If customer info is present but no auth, it's a customer
  if (context.customerName || context.customerEmail || context.customerPhone) {
    return 'customer';
  }
  // Public endpoints accessed without auth
  if (context.isPublic || context.vendorId) {
    return 'customer'; // Likely a customer viewing vendor page
  }
  return 'anonymous';
}

/**
 * Create a structured log entry
 * @param {string} severity - Log severity level
 * @param {string} message - Log message
 * @param {object} context - Additional context (user, request, error, etc.)
 */
function log(severity, message, context = {}) {
  const timestamp = new Date().toISOString();
  const userType = determineUserType(context);
  
  const logEntry = {
    severity,
    message,
    timestamp,
    userType, // Add user type to all logs
    ...context
  };

  // Use Firebase Functions logger which automatically sends to Cloud Logging
  // Format: severity level as prefix for better filtering in Cloud Console
  const logMessage = `[${severity}] ${message}`;
  
  switch (severity) {
    case Severity.DEBUG:
      functions.logger.debug(logMessage, context);
      break;
    case Severity.INFO:
      functions.logger.info(logMessage, context);
      break;
    case Severity.NOTICE:
      functions.logger.notice(logMessage, context);
      break;
    case Severity.WARNING:
      functions.logger.warn(logMessage, context);
      break;
    case Severity.ERROR:
    case Severity.CRITICAL:
    case Severity.ALERT:
    case Severity.EMERGENCY:
      functions.logger.error(logMessage, context);
      break;
    default:
      functions.logger.info(logMessage, context);
  }

  // Also log to console for local development
  if (process.env.FUNCTIONS_EMULATOR || process.env.NODE_ENV === 'development') {
    console.log(JSON.stringify(logEntry, null, 2));
  }
}

/**
 * Logger object with convenience methods
 */
const logger = {
  /**
   * Debug logs - detailed information for debugging
   */
  debug: (message, context) => log(Severity.DEBUG, message, context),

  /**
   * Info logs - general informational messages
   */
  info: (message, context) => log(Severity.INFO, message, context),

  /**
   * Notice logs - normal but significant events
   */
  notice: (message, context) => log(Severity.NOTICE, message, context),

  /**
   * Warning logs - warning messages
   */
  warn: (message, context) => log(Severity.WARNING, message, context),

  /**
   * Error logs - error events that might still allow the app to continue
   */
  error: (message, error, context = {}) => {
    const errorContext = {
      ...context,
      error: {
        message: error?.message || error,
        stack: error?.stack,
        code: error?.code,
        name: error?.name
      }
    };
    log(Severity.ERROR, message, errorContext);
  },

  /**
   * Critical logs - critical events that require immediate attention
   */
  critical: (message, error, context = {}) => {
    const errorContext = {
      ...context,
      error: {
        message: error?.message || error,
        stack: error?.stack,
        code: error?.code,
        name: error?.name
      }
    };
    log(Severity.CRITICAL, message, errorContext);
  },

  /**
   * Log API request with context
   */
  request: (req, additionalContext = {}) => {
    // Determine user type
    let userType = 'anonymous';
    if (req.user?.uid || req.user?.email) {
      userType = 'vendor'; // Authenticated users are vendors
    } else if (req.path.includes('/vendors/') && !req.path.includes('/profile') && !req.path.includes('/dashboard')) {
      userType = 'customer'; // Public vendor page access
    } else if (req.path.includes('/bookings') && req.method === 'POST') {
      userType = 'customer'; // Booking creation
    }
    
    log(Severity.INFO, 'API Request', {
      method: req.method,
      path: req.path,
      query: req.query,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.headers['x-forwarded-for'],
      userId: req.user?.uid || req.user?.email,
      userType,
      ...additionalContext
    });
  },

  /**
   * Log API response
   */
  response: (req, statusCode, duration, additionalContext = {}) => {
    const severity = statusCode >= 400 ? Severity.WARNING : Severity.INFO;
    
    // Determine user type (same logic as request)
    let userType = 'anonymous';
    if (req.user?.uid || req.user?.email) {
      userType = 'vendor';
    } else if (req.path.includes('/vendors/') && !req.path.includes('/profile') && !req.path.includes('/dashboard')) {
      userType = 'customer';
    } else if (req.path.includes('/bookings') && req.method === 'POST') {
      userType = 'customer';
    }
    
    log(severity, 'API Response', {
      method: req.method,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
      userId: req.user?.uid || req.user?.email,
      userType,
      ...additionalContext
    });
  }
};

module.exports = logger;
module.exports.Severity = Severity;

