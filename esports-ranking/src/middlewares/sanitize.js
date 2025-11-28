/**
 * Middleware to sanitize user input and prevent XSS attacks
 * Removes potentially dangerous HTML/JavaScript from request data
 */

/**
 * Escape HTML special characters to prevent XSS
 */
const escapeHtml = (text) => {
  if (typeof text !== 'string') return text;
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Remove script tags and dangerous attributes
 */
const removeScripts = (text) => {
  if (typeof text !== 'string') return text;
  
  // Remove script tags
  let cleaned = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  cleaned = cleaned.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can be used for XSS)
  cleaned = cleaned.replace(/data:text\/html/gi, '');
  
  return cleaned;
};

/**
 * Recursively sanitize object properties
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return removeScripts(escapeHtml(obj));
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Middleware to sanitize request body, query, and params
 */
export const sanitizeInput = (req, res, next) => {
  try {
    // Only sanitize body (query and params are read-only in Express 5)
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    res.status(500).json({
      code: 500,
      status: 500,
      message: 'Error processing request data'
    });
  }
};

/**
 * Whitelist-based sanitization for specific fields
 * Only allows alphanumeric, spaces, and safe punctuation
 */
export const sanitizeWithWhitelist = (allowedPattern = /^[a-zA-Z0-9\s\-_.@]+$/) => {
  return (req, res, next) => {
    const checkField = (value) => {
      if (typeof value === 'string' && !allowedPattern.test(value)) {
        return false;
      }
      return true;
    };

    // Check all string values in body
    if (req.body) {
      for (const key in req.body) {
        if (!checkField(req.body[key])) {
          return res.status(400).json({
            code: 400,
            status: 400,
            message: `Invalid characters in field: ${key}`
          });
        }
      }
    }

    next();
  };
};

export default sanitizeInput;
