  import { apiClient } from "./api";
  import { STORAGE_KEYS } from "../utils/constants";
  import storage from "../utils/storage";

  // ==================== AUTH SERVICE ==================== //
  const authService = {
    // Đăng ký
    register: async (userData) => {
      try {
        const res = await apiClient.post('/users/register', userData);

        // Backend trả về structure { code, status, message, data }
        if (res?.code === 0) return res;

        throw new Error(res?.message || 'Đăng ký thất bại');
      } catch (error) {
        console.error('Register error:', error);
        
        // Lấy message từ các nguồn khác nhau
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          error?.error ||
          'Đăng ký thất bại. Vui lòng thử lại.';
        
        throw new Error(errorMessage);
      }
    },

    // Đăng nhập
  login: async (credentials) => {
    const res = await apiClient.post('/users/login', {
      account: credentials.email,
      password: credentials.password,
    });

    // Không lưu token trong JS
    // Cookie httpOnly sẽ được gửi tự động trong các request tiếp theo
    return res; 
  },


    // Gửi OTP
    sendOtp: async (email) => {
      const res = await apiClient.post('/users/send-verification-email', { email });
      return res;
    },

    // Kiểm tra OTP
    checkOtp: async (email, otp) => {
      const res = await apiClient.post('/users/check-otp', { email, otp });
      return res;
    },

    // Đặt lại mật khẩu
    resetPassword: async (email, password) => {
      const res = await apiClient.post('/users/forgot-pass', { email, password });
      return res;
    },

    // Đăng xuất
    logout: async () => {
    storage.removeItem(STORAGE_KEYS.USER_DATA);
    await apiClient.post('/users/logout'); // backend xóa cookie
  },

  };

  export default authService;