const crypto = require('crypto');

/**
 * Generate a random string of specified length
 * @param {number} length - Length of the string to generate
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a secure JWT secret
 * @returns {string} Secure JWT secret
 */
const generateJWTSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Format API response
 * @param {boolean} success - Whether the operation was successful
 * @param {any} data - Response data
 * @param {string} message - Response message
 * @param {string} error - Error message (if any)
 * @returns {object} Formatted response object
 */
const formatResponse = (success, data = null, message = '', error = null) => {
  const response = {
    success,
    timestamp: new Date().toISOString()
  };

  if (success) {
    if (data !== null) response.data = data;
    if (message) response.message = message;
  } else {
    if (error) response.error = error;
    if (message) response.message = message;
  }

  return response;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and message
 */
const validatePassword = (password) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return {
      isValid: false,
      message: `Password must be at least ${minLength} characters long`
    };
  }

  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return {
      isValid: false,
      message: 'Password must contain uppercase, lowercase, and numbers'
    };
  }

  return {
    isValid: true,
    message: 'Password meets requirements'
  };
};

/**
 * Sanitize user input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Generate file hash for integrity checking
 * @param {Buffer} buffer - File buffer
 * @returns {string} SHA256 hash
 */
const generateFileHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Format file size in human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if file type is allowed
 * @param {string} mimetype - File MIME type
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @returns {boolean} Whether file type is allowed
 */
const isAllowedFileType = (mimetype, allowedTypes = []) => {
  const defaultAllowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
    'video/mp4', 'video/webm', 'video/ogg',
    'audio/mpeg', 'audio/wav', 'audio/ogg'
  ];

  const types = allowedTypes.length > 0 ? allowedTypes : defaultAllowedTypes;
  return types.includes(mimetype);
};

/**
 * Generate room invite code
 * @returns {string} 8-character invite code
 */
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Calculate time difference in human readable format
 * @param {Date} date - Date to compare
 * @returns {string} Human readable time difference
 */
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
};

/**
 * Pagination helper
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {object} Pagination metadata
 */
const getPaginationInfo = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

module.exports = {
  generateRandomString,
  generateJWTSecret,
  formatResponse,
  isValidEmail,
  validatePassword,
  sanitizeInput,
  generateFileHash,
  formatFileSize,
  isAllowedFileType,
  generateInviteCode,
  getTimeAgo,
  getPaginationInfo
};