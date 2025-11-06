/**
 * Validate email
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validate password (min 8 chars, at least 1 letter and 1 number)
 */
export const validatePassword = (password) => {
  if (!password || password.length < 8) return false;
  const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  return re.test(password);
};

/**
 * Validate username (alphanumeric, underscore, 3-20 chars)
 */
export const validateUsername = (username) => {
  if (!username || username.length < 3 || username.length > 20) return false;
  const re = /^[a-zA-Z0-9_]+$/;
  return re.test(username);
};

/**
 * Validate phone number (Vietnamese format)
 */
export const validatePhone = (phone) => {
  const re = /^(0|\+84)[0-9]{9}$/;
  return re.test(phone);
};

/**
 * Validate Ethereum address
 */
export const validateEthAddress = (address) => {
  const re = /^0x[a-fA-F0-9]{40}$/;
  return re.test(address);
};

/**
 * Validate URL
 */
export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Validate required field
 */
export const validateRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Validate min length
 */
export const validateMinLength = (value, minLength) => {
  if (!value) return false;
  return value.length >= minLength;
};

/**
 * Validate max length
 */
export const validateMaxLength = (value, maxLength) => {
  if (!value) return true;
  return value.length <= maxLength;
};

/**
 * Validate number range
 */
export const validateNumberRange = (value, min, max) => {
  const num = Number(value);
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
};

/**
 * Validate date range
 */
export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end >= start;
};

/**
 * Form validator - returns errors object
 */
export const validateForm = (values, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = values[field];
    
    // Required
    if (fieldRules.required && !validateRequired(value)) {
      errors[field] = fieldRules.messages?.required || `${field} là bắt buộc`;
      return;
    }
    
    // Skip other validations if empty and not required
    if (!value && !fieldRules.required) return;
    
    // Email
    if (fieldRules.email && !validateEmail(value)) {
      errors[field] = fieldRules.messages?.email || 'Email không hợp lệ';
      return;
    }
    
    // Password
    if (fieldRules.password && !validatePassword(value)) {
      errors[field] = fieldRules.messages?.password || 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số';
      return;
    }
    
    // Username
    if (fieldRules.username && !validateUsername(value)) {
      errors[field] = fieldRules.messages?.username || 'Username chỉ chứa chữ, số và dấu gạch dưới (3-20 ký tự)';
      return;
    }
    
    // Phone
    if (fieldRules.phone && !validatePhone(value)) {
      errors[field] = fieldRules.messages?.phone || 'Số điện thoại không hợp lệ';
      return;
    }
    
    // Ethereum address
    if (fieldRules.ethAddress && !validateEthAddress(value)) {
      errors[field] = fieldRules.messages?.ethAddress || 'Địa chỉ ví không hợp lệ';
      return;
    }
    
    // Min length
    if (fieldRules.minLength && !validateMinLength(value, fieldRules.minLength)) {
      errors[field] = fieldRules.messages?.minLength || `Tối thiểu ${fieldRules.minLength} ký tự`;
      return;
    }
    
    // Max length
    if (fieldRules.maxLength && !validateMaxLength(value, fieldRules.maxLength)) {
      errors[field] = fieldRules.messages?.maxLength || `Tối đa ${fieldRules.maxLength} ký tự`;
      return;
    }
    
    // Number range
    if (fieldRules.min !== undefined || fieldRules.max !== undefined) {
      if (!validateNumberRange(value, fieldRules.min, fieldRules.max)) {
        errors[field] = fieldRules.messages?.range || `Giá trị phải từ ${fieldRules.min} đến ${fieldRules.max}`;
        return;
      }
    }
    
    // Custom validator
    if (fieldRules.custom) {
      const customError = fieldRules.custom(value, values);
      if (customError) {
        errors[field] = customError;
        return;
      }
    }
  });
  
  return errors;
};

/**
 * Check if form has errors
 */
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};