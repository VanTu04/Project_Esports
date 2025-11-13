/**
 * Storage Utility
 * Sử dụng sessionStorage thay vì localStorage
 * Token sẽ mất khi đóng trình duyệt
 */

const storage = sessionStorage; // Thay đổi ở đây: sessionStorage thay vì localStorage

export const setItem = (key, value) => {
  try {
    storage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
};

export const getItem = (key) => {
  try {
    const item = storage.getItem(key);
    if (!item) return null;
    
    // Try parse JSON, nếu không được thì return string
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } catch (error) {
    console.error('Error reading from storage:', error);
    return null;
  }
};

export const removeItem = (key) => {
  try {
    storage.removeItem(key);
  } catch (error) {
    console.error('Error removing from storage:', error);
  }
};

export const clear = () => {
  try {
    storage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

export default {
  setItem,
  getItem,
  removeItem,
  clear,
};
