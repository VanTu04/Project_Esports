import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

// Tạo instance axios với baseURL tương đối (hoặc thay bằng URL backend thật nếu cần)
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor request: đính token tự động từ localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor response: xử lý lỗi và trả data trực tiếp
api.interceptors.response.use(
  (response) => response.data, // trả thẳng phần data bên trong response

  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Token hết hạn / không hợp lệ
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER_DATA);
          window.location.href = '/login';
          break;

        case 403:
          console.error('Access forbidden:', data.message || data);
          break;

        case 404:
          console.error('Resource not found:', data.message || data);
          break;

        case 422:
          console.error('Validation error:', data.errors || data.message || data);
          break;

        case 500:
          console.error('Server error:', data.message || data);
          break;

        default:
          console.error('API error:', data.message || data);
      }

      return Promise.reject(data);
    } else if (error.request) {
      console.error('No response from server');
      return Promise.reject({ message: 'Không thể kết nối đến server' });
    } else {
      console.error('Request error:', error.message);
      return Promise.reject({ message: error.message });
    }
  }
);

// Các phương thức api thông dụng
export const apiClient = {
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  patch: (url, data, config) => api.patch(url, data, config),
  delete: (url, config) => api.delete(url, config),
};

// Hàm upload file hỗ trợ callback progress
export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};

export default api;
