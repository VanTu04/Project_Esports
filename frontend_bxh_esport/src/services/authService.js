import axios from "axios";
import { API_CONFIG } from "../config";
import { STORAGE_KEYS } from "../utils/constants";
import storage from "../utils/storage";

const api = axios.create({
  baseURL: '/api',  
  timeout: API_CONFIG.timeout,
});

api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.code !== 0) {
      return Promise.reject({
        message: response.data.message || 'Có lỗi xảy ra',
        code: response.data.code
      });
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================== AUTH SERVICE ==================== //
const authService = {
  // Đăng ký
  register: async (userData) => {
    const res = await api.post("/users/register", userData);
    if (res.data?.data?.token) {
      storage.setItem(STORAGE_KEYS.AUTH_TOKEN, res.data.data.token);
      storage.setItem(STORAGE_KEYS.USER_DATA, res.data.data.user);
    }
    return res.data;
  },

  // Đăng nhập
  login: async (credentials) => {
    const payload = {
      account: credentials.email,  
      password: credentials.password
    };
    
    const res = await api.post("/users/login", payload);
    
    if (res.data?.data?.accessToken) {
      storage.setItem(STORAGE_KEYS.AUTH_TOKEN, res.data.data.accessToken);
      if (res.data.data.refreshToken) {
        storage.setItem('REFRESH_TOKEN', res.data.data.refreshToken);
      }
    }
    return res.data;
  },

  // Gửi OTP
  sendOtp: async (email) => {
    const res = await api.post("/users/send-verification-email", { email });
    return res.data;
  },

  // Kiểm tra OTP
  checkOtp: async (email, otp) => {
    const res = await api.post("/users/check-otp", { email, otp });
    return res.data;
  },

  // Đặt lại mật khẩu
  resetPassword: async (email, password) => {
    const res = await api.post("/users/forgot-pass", { email, password });
    return res.data;
  },

  // Đăng xuất
  logout: async () => {
    storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    storage.removeItem(STORAGE_KEYS.USER_DATA);
  },
};

export default authService;