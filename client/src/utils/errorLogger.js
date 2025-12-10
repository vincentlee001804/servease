/**
 * Client-side error logging utility
 * Logs errors to console and optionally sends to backend for tracking
 * 
 * Usage:
 *   import { logError, logInfo } from '../utils/errorLogger';
 *   logError('Failed to load data', error, { userId: '123', action: 'loadDashboard' });
 */

const API_BASE = process.env.REACT_APP_API_URL || 'https://api-6b4nslsuyq-uc.a.run.app';

/**
 * Determine user type from current page/context
 * @returns {string} - 'vendor' or 'customer'
 */
function determineUserType() {
  const url = window.location.href;
  const path = window.location.pathname;
  
  // Vendor pages
  if (path.includes('/dashboard') || path.includes('/ai') || path.includes('/register') || path.includes('/login')) {
    return 'vendor';
  }
  // Customer pages (vendor pages, booking pages, home)
  if (path.includes('/vendor/') || path.includes('/booking') || path.includes('/bookings')) {
    return 'customer';
  }
  // Default to customer for public pages
  return 'customer';
}

/**
 * Log error with context
 * @param {string} message - Error message
 * @param {Error|object} error - Error object or error details
 * @param {object} context - Additional context (userId, action, etc.)
 */
export const logError = async (message, error = null, context = {}) => {
  const userType = determineUserType();
  
  const errorDetails = {
    message,
    error: error?.message || error,
    stack: error?.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    userType, // Add user type to client errors
    ...context
  };

  // Always log to console for development
  console.error('🚨 Error:', errorDetails);

  // In production, optionally send to backend for centralized logging
  if (process.env.NODE_ENV === 'production') {
    try {
      // Send error to backend (non-blocking, don't wait for response)
      fetch(`${API_BASE}/logs/error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorDetails),
        keepalive: true // Ensures request is sent even if page is closing
      }).catch(err => {
        // Silently fail - don't log logging errors
        console.debug('Failed to send error log to backend:', err);
      });
    } catch (err) {
      // Silently fail
      console.debug('Error logging failed:', err);
    }
  }
};

/**
 * Log info message
 * @param {string} message - Info message
 * @param {object} context - Additional context
 */
export const logInfo = (message, context = {}) => {
  const logDetails = {
    message,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    ...context
  };

  console.info('ℹ️ Info:', logDetails);
};

/**
 * Log warning
 * @param {string} message - Warning message
 * @param {object} context - Additional context
 */
export const logWarning = (message, context = {}) => {
  const logDetails = {
    message,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    ...context
  };

  console.warn('⚠️ Warning:', logDetails);
};

/**
 * Setup global error handlers
 */
export const setupErrorHandlers = () => {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError('Unhandled Promise Rejection', event.reason, {
      type: 'unhandledRejection'
    });
  });

  // Catch JavaScript errors
  window.addEventListener('error', (event) => {
    logError('JavaScript Error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    }, {
      type: 'javascriptError'
    });
  });
};

export default {
  logError,
  logInfo,
  logWarning,
  setupErrorHandlers
};

