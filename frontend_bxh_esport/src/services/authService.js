import axios from "axios";
import { API_CONFIG } from "../config";
import { STORAGE_KEYS } from "../utils/constants";
import storage from "../utils/storage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BACKEND || API_CONFIG.baseURL,  
  timeout: API_CONFIG.timeout,
});

api.interceptors.response.use(
  (response) => {
    // Nếu backend trả về code khác 0 (lỗi), reject với message cụ thể
    if (response.data && response.data.code !== undefined && response.data.code !== 0) {
      return Promise.reject({
        message: response.data.message || 'Có lỗi xảy ra',
        code: response.data.code,
        response: response
      });
    }
    return response;
  },
  (error) => {
    // Network error hoặc server error
    if (error.response) {
      // Server trả về response với status code khác 2xx
      return Promise.reject({
        message: error.response.data?.message || error.message,
        status: error.response.status,
        response: error.response
      });
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH SERVICE ==================== //
const authService = {
  // Đăng ký
  register: async (userData) => {
    try {
      const res = await api.post("/users/register", userData);
      
      // Backend trả về {code: 0, status: 200, data: {user: {...}}, message: string}
      if (res.data?.code === 0) {
        // Không cần lưu token vì backend không trả token khi register
        // User phải login sau khi register
        return res.data;
      }
      
      throw new Error(res.data?.message || "Đăng ký thất bại");
    } catch (error) {
      console.error('Register error:', error);
      
      // Lấy message từ các nguồn khác nhau
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        error?.error ||
        "Đăng ký thất bại. Vui lòng thử lại.";
      
      throw new Error(errorMessage);
    }
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