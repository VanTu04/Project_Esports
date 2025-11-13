import axios from 'axios';
import { STORAGE_KEYS, API_BASE_URL } from '../utils/constants';
import storage from '../utils/storage';

// Tạo instance axios với baseURL tương đối (hoặc thay bằng URL backend thật nếu cần)
// API_BASE_URL resolves to import.meta.env.VITE_API_BASE_URL or '/api' by default.
// When developing with Vite, the dev server proxy (vite.config.js) will forward `/api` to the backend target.
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helpful developer hint when default base is used
if (API_BASE_URL === '/api') {
  // eslint-disable-next-line no-console
  console.warn(
    '[api] using relative baseURL "/api". Ensure you run the frontend via Vite dev server with the proxy configured, or set VITE_API_BASE_URL to the backend URL.'
  );
}

// Interceptor request: đính token tự động từ sessionStorage
api.interceptors.request.use(
  (config) => {
    const token = storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
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
          storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          storage.removeItem(STORAGE_KEYS.USER_DATA);
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
