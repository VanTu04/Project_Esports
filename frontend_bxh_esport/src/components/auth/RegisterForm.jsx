import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useUserValidation } from '../../hooks/useUserValidation';
import { validateForm } from '../../utils/validators';
import Button from '../common/Button';
import { API_BASE_URL, TURNSTILE_SITE_KEY } from '../../utils/constants';

export const RegisterForm = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { checkingEmail, checkingUsername, checkEmailExists, checkUsernameExists } = useUserValidation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [captchaToken, setCaptchaToken] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleEmailBlur = async () => {
    const email = formData.email.trim();
    if (!email) return;

    const errorMessage = await checkEmailExists(email);
    if (errorMessage) {
      setErrors(prev => ({ ...prev, email: errorMessage }));
    } else if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handleUsernameBlur = async () => {
    const username = formData.username.trim();
    if (!username) return;

    const errorMessage = await checkUsernameExists(username);
    if (errorMessage) {
      setErrors(prev => ({ ...prev, username: errorMessage }));
    } else if (errors.username) {
      setErrors(prev => ({ ...prev, username: '' }));
    }
  };  const handleSubmit = async (e) => {
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
      const firstError = Object.values(validationErrors)[0];
      showError(firstError);
      return;
    }

    // Check if there are existing errors from blur validation
    if (errors.email || errors.username) {
      showError('Vui lòng sửa lỗi trước khi đăng ký');
      return;
    }

    // Validate CAPTCHA
    if (!captchaToken) {
      showError('Vui lòng xác thực CAPTCHA');
      return;
    }

    setLoading(true);
    try {
  const res = await register({ ...formData, captchaToken });
  showSuccess('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.');
  // Sau khi đăng ký thành công, chuyển sang trang login để người dùng đăng nhập
  navigate('/login');
    } catch (err) {
      console.error('Register error:', err);

      // Giống CreateAccountAdmin: lấy thông báo lỗi cụ thể hơn
      const message = 
        err?.message || 
        err?.error || 
        err?.response?.data?.message ||
        err?.data?.message || 
        'Đăng ký thất bại. Vui lòng thử lại.';

      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Họ và tên */}
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

      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tên tài khoản
        </label>
        <div className="relative">
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            onBlur={handleUsernameBlur}
            className={`w-full px-4 py-2 bg-dark-400 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.username ? 'border-red-500' : 'border-primary-700/30'
            }`}
          />
          {checkingUsername && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="animate-spin h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>
        {checkingUsername && (
          <p className="text-xs text-gray-400 mt-1">Đang kiểm tra...</p>
        )}
        {errors.username && (
          <p className="text-xs text-red-500 mt-1">{errors.username}</p>
        )}
        {!errors.username && formData.username && !checkingUsername && (
          <p className="text-xs text-green-400 mt-1">✓ Tên tài khoản khả dụng</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email
        </label>
        <div className="relative">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleEmailBlur}
            className={`w-full px-4 py-2 bg-dark-400 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.email ? 'border-red-500' : 'border-primary-700/30'
            }`}
          />
          {checkingEmail && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="animate-spin h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>
        {checkingEmail && (
          <p className="text-xs text-gray-400 mt-1">Đang kiểm tra...</p>
        )}
        {errors.email && (
          <p className="text-xs text-red-500 mt-1">{errors.email}</p>
        )}
        {!errors.email && formData.email && !checkingEmail && (
          <p className="text-xs text-green-400 mt-1">✓ Email khả dụng</p>
        )}
      </div>

      {/* Password */}
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

      {/* Confirm Password */}
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

      {/* Cloudflare Turnstile CAPTCHA */}
      <div className="flex justify-center">
        <Turnstile
          siteKey={TURNSTILE_SITE_KEY}
          onSuccess={(token) => setCaptchaToken(token)}
          onError={() => {
            setCaptchaToken(null);
            showError('Xác thực CAPTCHA thất bại. Vui lòng thử lại.');
          }}
          onExpire={() => setCaptchaToken(null)}
          theme="dark"
        />
      </div>

      <Button 
        type="submit" 
        fullWidth 
        loading={loading}
        disabled={loading || checkingEmail || checkingUsername || !!errors.email || !!errors.username}
      >
        Đăng ký
      </Button>

      <div className="text-center text-sm text-gray-400">Hoặc đăng ký bằng</div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Đăng ký với Google"
          onClick={() => {
            window.location.href = `${API_BASE_URL}/auth/google`;
          }}
          className="p-2 rounded-md bg-white hover:opacity-90 transition-opacity"
          title="Google"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path
              fill="#EA4335"
              d="M24 9.5c3.9 0 7.2 1.4 9.7 3.6l7.2-7.2C35 2.2 29.9 0 24 0 14.7 0 6.9 5.6 3.1 13.6l8.6 6.7C13.5 15.1 18.3 9.5 24 9.5z"
            />
            <path
              fill="#34A853"
              d="M46.5 24c0-1.6-.1-3.1-.4-4.6H24v9h12.7c-.5 2.7-2 5-4.3 6.6l6.8 5.3C44.6 36.4 46.5 30.5 46.5 24z"
            />
            <path
              fill="#4A90E2"
              d="M11.7 28.3C10.8 26.5 10.3 24.6 10.3 22.5c0-2.1.5-4 1.4-5.8L3.1 10C1.1 13.8 0 18 0 22.5s1.1 8.7 3.1 12.5l8.6-6.7z"
            />
            <path
              fill="#FBBC05"
              d="M24 48c6.5 0 12-2.1 16-5.9l-7.6-6.1c-2.5 1.7-5.6 2.7-8.4 2.7-5.7 0-10.5-4.6-11.8-10.7L3.1 34.5C6.9 42.4 14.7 48 24 48z"
            />
          </svg>
        </button>

        <button
          type="button"
          aria-label="Đăng ký với Facebook"
          onClick={() => {
            window.location.href = `${API_BASE_URL}/auth/facebook`;
          }}
          className="p-2 rounded-md bg-[#1877F2] hover:opacity-90 transition-opacity"
          title="Facebook"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#fff"
              d="M22 12a10 10 0 10-11.5 9.9v-7h-2.2V12h2.2V9.7c0-2.2 1.3-3.4 3.3-3.4.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 2.9h-1.9v7A10 10 0 0022 12z"
            />
          </svg>
        </button>
      </div>
    </form>
  );
};
