/**
 * Frontend XSS protection utilities
 */

/**
 * Escape HTML special characters to prevent XSS
 * Use this when displaying user-generated content
 */
export const escapeHtml = (text) => {
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
 * Strip HTML tags from string
 * Use this to display plain text from user input
 */
export const stripHtml = (html) => {
  if (typeof html !== 'string') return html;
  
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return '#';
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return '#';
  }
  
  return url;
};

/**
 * Validate and sanitize input before sending to backend
 */
export const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  
  // Remove control characters
  let sanitized = value.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

/**
 * Create safe HTML from user content
 * This is a simple implementation - for production, consider using DOMPurify
 */
export const createSafeHtml = (html) => {
  if (typeof html !== 'string') return '';
  
  // Remove script tags
  let safe = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  safe = safe.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  safe = safe.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  safe = safe.replace(/javascript:/gi, '');
  
  // Remove dangerous tags
  const dangerousTags = ['iframe', 'embed', 'object', 'link', 'style'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
    safe = safe.replace(regex, '');
  });
  
  return safe;
};

/**
 * React component wrapper to safely render HTML
 * Usage: <SafeHtml html={userContent} />
 */
export const SafeHtml = ({ html, className = '' }) => {
  const safeHtml = createSafeHtml(html);
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
};

export default {
  escapeHtml,
  stripHtml,
  sanitizeUrl,
  sanitizeInput,
  createSafeHtml,
  SafeHtml,
};
