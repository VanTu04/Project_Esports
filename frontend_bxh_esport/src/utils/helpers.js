import { format, formatDistanceToNow, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
// import { DATE_FORMATS } from './constants';

/**
 * Format date to string
 */
export const formatDate = (date, formatStr = DATE_FORMATS.DATETIME) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, formatStr, { locale: vi });
};

/**
 * Format relative time (e.g., "2 giờ trước")
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return '';
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: vi });
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format wallet address (0x1234...5678)
 */
export const formatWalletAddress = (address, startChars = 6, endChars = 4) => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format currency (VND or crypto)
 */
export const formatCurrency = (amount, currency = 'VND', decimals = 0) => {
  if (amount === null || amount === undefined) return '0';
  
  if (currency === 'VND') {
    return `${formatNumber(amount, decimals)} ₫`;
  }
  
  if (currency === 'ETH') {
    return `${formatNumber(amount, 4)} ETH`;
  }
  
  return `${formatNumber(amount, decimals)} ${currency}`;
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total, decimals = 1) => {
  if (!total || total === 0) return 0;
  return ((value / total) * 100).toFixed(decimals);
};

/**
 * Get status badge color
 */
export const getStatusColor = (status) => {
  const statusColors = {
    active: 'bg-green-500',
    inactive: 'bg-gray-500',
    banned: 'bg-red-500',
    pending: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    upcoming: 'bg-blue-500',
    ongoing: 'bg-primary-500',
    completed: 'bg-gray-600',
    cancelled: 'bg-red-600',
    scheduled: 'bg-blue-500',
    live: 'bg-red-500',
    postponed: 'bg-orange-500',
  };
  
  return statusColors[status?.toLowerCase()] || 'bg-gray-500';
};

/**
 * Get status text in Vietnamese
 */
export const getStatusText = (status) => {
  const statusTexts = {
    active: 'Hoạt động',
    inactive: 'Không hoạt động',
    banned: 'Bị khóa',
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    upcoming: 'Sắp diễn ra',
    ongoing: 'Đang diễn ra',
    completed: 'Đã kết thúc',
    cancelled: 'Đã hủy',
    scheduled: 'Đã lên lịch',
    live: 'Đang live',
    postponed: 'Hoãn lại',
  };
  
  return statusTexts[status?.toLowerCase()] || status;
};

/**
 * Debounce function
 */
export const debounce = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj) => {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

/**
 * Generate random color
 */
export const generateRandomColor = () => {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

/**
 * Download file
 */
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Get file extension
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Validate file size
 */
export const validateFileSize = (file, maxSize) => {
  return file.size <= maxSize;
};

/**
 * Validate file type
 */
export const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Sleep/delay function
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generate pagination array
 */
export const generatePaginationArray = (currentPage, totalPages, maxVisible = 5) => {
  const pages = [];
  const halfVisible = Math.floor(maxVisible / 2);
  
  let startPage = Math.max(1, currentPage - halfVisible);
  let endPage = Math.min(totalPages, currentPage + halfVisible);
  
  if (endPage - startPage + 1 < maxVisible) {
    if (startPage === 1) {
      endPage = Math.min(totalPages, startPage + maxVisible - 1);
    } else {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return pages;
};

/**
 * Sort array by key
 */
export const sortByKey = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Group array by key
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};