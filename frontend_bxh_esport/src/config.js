export const USE_MOCK_API = false; // dùng backend thật

export const API_CONFIG = {
  useMock: USE_MOCK_API,
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api',
  timeout: 30000,
};
