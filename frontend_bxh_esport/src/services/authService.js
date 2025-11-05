import axios from "axios";
import { API_CONFIG } from "../config";
import { STORAGE_KEYS } from "../utils/constants";

const api = axios.create({
  baseURL: '/api',  
  timeout: API_CONFIG.timeout,
});

// ==================== AUTH SERVICE ==================== //
const authService = {
  // Đăng ký
  register: async (userData) => {
    const res = await api.post("/users/register", userData);
    if (res.data?.data?.token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, res.data.data.token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(res.data.data.user));
    }
    return res.data;
  },

  // Đăng nhập
  // Đổi field từ email → account
login: async (credentials) => {
  const payload = {
    account: credentials.email,  
    password: credentials.password
  };
  
  const res = await api.post("/users/login", payload);
  
  // Backend trả về accessToken, không phải token
  if (res.data?.data?.accessToken) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, res.data.data.accessToken);
    // Lưu luôn refreshToken nếu cần
    if (res.data.data.refreshToken) {
      localStorage.setItem('REFRESH_TOKEN', res.data.data.refreshToken);
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

    // Đặt lại mật khẩu (bước cuối)
    resetPassword: async (email, password) => {
      const res = await api.post("/users/forgot-pass", { email, password });
      return res.data;
    },


  // Đăng xuất
  logout: async () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },
  
};

export default authService;
