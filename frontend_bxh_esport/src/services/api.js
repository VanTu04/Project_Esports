import axios from 'axios';
import { STORAGE_KEYS, API_BASE_URL, API_ENDPOINTS } from '../utils/constants';
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
  withCredentials: true,
});

// Refresh control / queue for concurrent 401 handling
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, result = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(result);
  });
  failedQueue = [];
};

// Helpful developer hint when default base is used
if (API_BASE_URL === '/api') {
  // eslint-disable-next-line no-console
  console.warn(
    '[api] using relative baseURL "/api". Ensure you run the frontend via Vite dev server with the proxy configured, or set VITE_API_BASE_URL to the backend URL.'
  );
}

// Interceptor response: xử lý lỗi và trả data trực tiếp
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest))
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post(API_ENDPOINTS.REFRESH_TOKEN); // backend tạo accessToken mới trong cookie
        processQueue(null);
        return api(originalRequest); // retry request gốc
      } catch (err) {
        processQueue(err, null);
        
        // Nếu refresh token thất bại (401) → logout user
        if (err.response?.status === 401) {
          console.warn('[api] Refresh token expired, logging out...');
          
          // Clear all cookies/storage
          storage.remove(STORAGE_KEYS.USER);
          storage.remove(STORAGE_KEYS.TOKEN);
          
          // Redirect to login
          window.location.href = '/login';
        }
        
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
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
