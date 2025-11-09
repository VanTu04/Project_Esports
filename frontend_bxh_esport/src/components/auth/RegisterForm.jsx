import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { validateForm } from '../../utils/validators';
import Button from '../common/Button';
import { API_BASE_URL } from '../../utils/constants';

export const RegisterForm = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', 
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    const validationErrors = validateForm(formData, {
      full_name: { required: true }, 
      username: { required: true, username: true },
      email: { required: true, email: true },
      password: { required: true, password: true },
      confirmPassword: {
        required: true,
        custom: (value) =>
          value !== formData.password ? 'Mật khẩu không khớp' : null,
      },
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      showSuccess('Đăng ký thành công!');
      navigate('/');
    } catch (error) {
      showError(error.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Họ và tên
        </label>
        <input
          type="text"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-dark-400 border border-primary-700/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {errors.full_name && (
          <p className="mt-1 text-sm text-red-500">{errors.full_name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tên người dùng
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-dark-400 border border-primary-700/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-500">{errors.username}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-dark-400 border border-primary-700/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Xác nhận mật khẩu
        </label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-dark-400 border border-primary-700/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
        )}
      </div>

      <Button type="submit" fullWidth loading={loading}>
        Đăng ký
      </Button>

      <div className="text-center text-sm text-gray-400">Hoặc đăng ký bằng</div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Đăng ký với Google"
          onClick={() => {
            try {
              window.location.href = `${API_BASE_URL}/auth/oauth/google`;
            } catch (e) {
              window.location.href = `/auth/oauth/google`;
            }
          }}
          className="p-2 rounded-md bg-white hover:opacity-90"
          title="Google"
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
          aria-label="Đăng ký với Facebook"
          onClick={() => {
            try {
              window.location.href = `${API_BASE_URL}/auth/oauth/facebook`;
            } catch (e) {
              window.location.href = `/auth/oauth/facebook`;
            }
          }}
          className="p-2 rounded-md bg-[#1877F2] hover:opacity-90"
          title="Facebook"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fill="#fff" d="M22 12a10 10 0 10-11.5 9.9v-7h-2.2V12h2.2V9.7c0-2.2 1.3-3.4 3.3-3.4.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 2.9h-1.9v7A10 10 0 0022 12z"/>
          </svg>
        </button>
      </div>
    </form>
  );
};
