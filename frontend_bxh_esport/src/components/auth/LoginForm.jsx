import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES, ROUTES } from '../../utils/constants';
import { useNotification } from '../../context/NotificationContext';
import { validateForm } from '../../utils/validators';
import Button from '../common/Button';
import { API_BASE_URL } from '../../utils/constants';

// Helper function để decode JWT token
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors trước khi validate
    setErrors({});
    
    const validationErrors = validateForm(formData, {
      email: { required: true }, // Bỏ validation email vì có thể nhập username
      password: { required: true },
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await login(formData);
      
      // Kiểm tra response thành công
      if (response?.code === 0 && response?.status === 200) {
        showSuccess("Đăng nhập thành công!");
        
        // Decode JWT token để lấy thông tin user
        const accessToken = response?.data?.accessToken;
        const decodedToken = decodeJWT(accessToken);
                
        const role = Number(decodedToken?.role || decodedToken?.user_role || 1);
        
        // Điều hướng theo role
        if (role === 4) {
          navigate(ROUTES.ADMIN_DASHBOARD);
        } else if (role === 3) {
          navigate(ROUTES.TEAM_MANAGER_DASHBOARD);
        } else if (role === 2) {
          navigate(ROUTES.PLAYER_DASHBOARD);
        } else {
          navigate(ROUTES.HOME);
        }
      } else {
        // Hiển thị lỗi từ backend
        const errorMessage = response?.errors || response?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại!";
        showError(errorMessage);
      }
    } catch (error) {
      // Xử lý các loại lỗi khác nhau
      console.error('Login error:', error);
      
      let errorMessage = 'Đăng nhập thất bại';
      
      // Lỗi từ API response
      if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } 
      // Lỗi từ axios interceptor
      else if (error.message) {
        errorMessage = error.message;
      }
      // Lỗi network
      else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Không thể kết nối đến máy chủ';
      }
      // Lỗi timeout
      else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Yêu cầu quá thời gian chờ';
      }
      
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email hoặc Tên đăng nhập
        </label>
        <input
          type="text"  
          name="email"
          placeholder="Nhập email hoặc username"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-dark-400 border border-primary-700/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={loading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Mật khẩu
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-dark-400 border border-primary-700/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={loading}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password}</p>
        )}
      </div>

      <Button type="submit" fullWidth loading={loading}>
        Đăng nhập
      </Button>

      <div className="text-center text-sm text-gray-400">Hoặc đăng nhập bằng</div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Đăng nhập với Google"
          onClick={() => {
            try {
              window.location.href = `${API_BASE_URL}/auth/google`;
            } catch (e) {
              window.location.href = `/auth/google`;
            }
          }}
          className="p-2 rounded-md bg-white hover:opacity-90"
          title="Google"
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.9 0 7.2 1.4 9.7 3.6l7.2-7.2C35 2.2 29.9 0 24 0 14.7 0 6.9 5.6 3.1 13.6l8.6 6.7C13.5 15.1 18.3 9.5 24 9.5z"/>
            <path fill="#34A853" d="M46.5 24c0-1.6-.1-3.1-.4-4.6H24v9h12.7c-.5 2.7-2 5-4.3 6.6l6.8 5.3C44.6 36.4 46.5 30.5 46.5 24z"/>
            <path fill="#4A90E2" d="M11.7 28.3C10.8 26.5 10.3 24.6 10.3 22.5c0-2.1.5-4 1.4-5.8L3.1 10C1.1 13.8 0 18 0 22.5s1.1 8.7 3.1 12.5l8.6-6.7z"/>
            <path fill="#FBBC05" d="M24 48c6.5 0 12-2.1 16-5.9l-7.6-6.1c-2.5 1.7-5.6 2.7-8.4 2.7-5.7 0-10.5-4.6-11.8-10.7L3.1 34.5C6.9 42.4 14.7 48 24 48z"/>
          </svg>
        </button>

        <button
          type="button"
          aria-label="Đăng nhập với Facebook"
          className="p-2 rounded-md bg-[#1877F2] hover:opacity-90"
          title="Facebook"
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fill="#fff" d="M22 12a10 10 0 10-11.5 9.9v-7h-2.2V12h2.2V9.7c0-2.2 1.3-3.4 3.3-3.4.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 2.9h-1.9v7A10 10 0 0022 12z"/>
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-start text-sm">
        <Link to="/forgot-password" className="text-primary-500 hover:underline">Quên mật khẩu?</Link>
      </div>
    </form>
  );
};