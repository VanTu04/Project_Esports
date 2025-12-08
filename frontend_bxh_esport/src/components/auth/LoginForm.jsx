import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import OtpModal from '../common/OtpModal';
import { USER_ROLES, ROUTES, TURNSTILE_SITE_KEY } from '../../utils/constants';
import { useNotification } from '../../context/NotificationContext';
import { validateForm } from '../../utils/validators';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { API_URL } from '../../utils/constants';

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
  const { login, updateUser, markAuthenticated } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [captchaToken, setCaptchaToken] = useState(null);
  const [showLoginOtpModal, setShowLoginOtpModal] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showLoginTotpModal, setShowLoginTotpModal] = useState(false);
  const [totpLoading, setTotpLoading] = useState(false);
  const [hasTotp, setHasTotp] = useState(false);
  const [hasEmail, setHasEmail] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [emailFallbackLoading, setEmailFallbackLoading] = useState(false);

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
      const firstError = Object.values(validationErrors)[0];
      showError(firstError);
      return;
    }

    // Validate CAPTCHA
    if (!captchaToken) {
      showError('Vui lòng xác thực CAPTCHA');
      return;
    }

    setLoading(true);
    try {
      const response = await login({ ...formData, captchaToken });

      // detect twoFactorRequired in several possible payload shapes
      const payload = response?.data || response?.data?.data || response || {};
      if (payload && payload.twoFactorRequired) {
        // Determine available methods. Backend may return `method`, or an array `methods`,
        // or include the user object with flags like `totp_secret` / `email_two_factor_enabled`.
        const explicitMethod = payload.method;
        const methods = Array.isArray(payload.methods) ? payload.methods : (Array.isArray(payload.availableMethods) ? payload.availableMethods : []);
        const userObj = payload.user || (payload.data && payload.data.user) || null;

        const hasTotpDetected = methods.includes('totp') || explicitMethod === 'totp' || Boolean(userObj && userObj.totp_secret) || Boolean(payload.totp);
        // Consider email 2FA enabled only when explicitly indicated by flags/methods.
        // Do NOT treat presence of `payload.email` (the user's email) as meaning email-2FA is enabled.
        const hasEmailDetected = methods.includes('email') || explicitMethod === 'email' || Boolean(userObj && userObj.email_two_factor_enabled) || Boolean(payload.email_two_factor_enabled);
        // persist detection to state so modals / buttons can use it
        setHasTotp(!!hasTotpDetected);
        setHasEmail(!!hasEmailDetected);
        // store the actual email returned from server (used when user logged in with username)
        const serverEmail = payload.email || (userObj && userObj.email) || formData.email;
        setTwoFactorEmail(serverEmail || '');

        // Prefer TOTP when both are available — use detected values
        const preferTotp = hasTotpDetected && hasEmailDetected ? true : hasTotpDetected;

        if (preferTotp) {
          // show TOTP modal by default; keep an explicit fallback button to send email
          setShowLoginTotpModal(true);
          setLoading(false);
          return;
        }

        // Fallback: email OTP
        // Try to explicitly request an email OTP in case backend didn't send one.
        try {
          setOtpLoading(true);
          // request the server to send a login-specific OTP template
          await authService.sendOtp(serverEmail || formData.email, 'login');
          showSuccess('Mã OTP đã được gửi tới email của bạn. Vui lòng kiểm tra email.');
          setShowLoginOtpModal(true);
        } catch (err) {
          console.error('sendOtp error', err);
          showError('Không thể gửi mã OTP qua email. Vui lòng thử lại hoặc dùng Authenticator.');
        } finally {
          setOtpLoading(false);
        }
        setLoading(false);
        return;
      }

      // Kiểm tra response thành công (không yêu cầu 2FA)
      if (response?.code === 0 && response?.status === 200) {
        showSuccess("Đăng nhập thành công!");
                
        const role = Number(response.data.user.role || 1);
        
        // Điều hướng theo role
        if (role === 4) {
          navigate(ROUTES.ADMIN_DASHBOARD);
        } else if (role === 3) {
          navigate(ROUTES.TEAM_MANAGER_DASHBOARD);
        } else {
          navigate(ROUTES.HOME);
        }
      } else {
        // Hiển thị lỗi từ backend
        const errorMessage = response?.errors || response?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại!";
        showError(errorMessage);
      }
    } catch (err) {
      // Xử lý các loại lỗi khác nhau
      console.error('Login error:', err);
      
      // Giống RegisterForm: lấy thông báo lỗi cụ thể hơn
      const message = 
        err?.message || 
        err?.error || 
        err?.response?.data?.message ||
        err?.response?.data?.errors ||
        err?.data?.message || 
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!';
      
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginOtpConfirm = async (otp) => {
    try {
      setOtpLoading(true);
      const accountForConfirm = twoFactorEmail || formData.email;
      const confirmRes = await authService.confirmTwoFactorLogin(accountForConfirm, otp);

      if (confirmRes?.code === 0) {
        showSuccess('Đăng nhập thành công!');
        const userInfo = confirmRes.data.user;
        if (userInfo) {
          updateUser(userInfo);
          markAuthenticated();
        }
        const role = Number(userInfo?.role || 1);
        if (role === 4) {
          navigate(ROUTES.ADMIN_DASHBOARD);
        } else if (role === 3) {
          navigate(ROUTES.TEAM_MANAGER_DASHBOARD);
        } else {
          navigate(ROUTES.HOME);
        }
      } else {
        showError(confirmRes?.errors || confirmRes?.message || 'Xác thực 2FA thất bại');
      }
    } catch (err) {
      const message = err?.message || err?.response?.data?.message || 'Xác thực 2FA thất bại';
      showError(message);
    } finally {
      setOtpLoading(false);
      setShowLoginOtpModal(false);
    }
  };

  const handleLoginTotpConfirm = async (otp) => {
    try {
      setTotpLoading(true);
      const accountForConfirm = twoFactorEmail || formData.email;
      const res = await authService.confirmTotpLogin(accountForConfirm, otp);
      if (res?.code === 0) {
        showSuccess('Đăng nhập thành công!');
        const userInfo = res.data.user;
        if (userInfo) {
          updateUser(userInfo);
          markAuthenticated();
        }
        const role = Number(userInfo?.role || 1);
        if (role === 4) navigate(ROUTES.ADMIN_DASHBOARD);
        else if (role === 3) navigate(ROUTES.TEAM_MANAGER_DASHBOARD);
        else navigate(ROUTES.HOME);
      } else {
        showError(res?.message || 'Xác thực TOTP thất bại');
      }
    } catch (err) {
      showError(err?.message || err?.response?.data?.message || 'Xác thực TOTP thất bại');
    } finally {
      setTotpLoading(false);
      setShowLoginTotpModal(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email hoặc Tên tài khoản
        </label>
        <input
          type="text"  
          name="email"
          placeholder="Nhập email hoặc tên tài khoản"
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

      {/* Cloudflare Turnstile CAPTCHA */}
      <div className="flex justify-center">
        <Turnstile
          siteKey={TURNSTILE_SITE_KEY}
          onSuccess={(token) => {
            console.log('✅ Turnstile Success! Token:', token?.substring(0, 20) + '...');
            setCaptchaToken(token);
          }}
          onError={(error) => {
            console.error('❌ Turnstile Error:', error);
            setCaptchaToken(null);
            showError('Xác thực CAPTCHA thất bại. Vui lòng thử lại.');
          }}
          onExpire={() => {
            console.warn('⏰ Turnstile Expired');
            setCaptchaToken(null);
          }}
          onLoad={() => {
            console.log('📦 Turnstile Loaded. Site Key:', TURNSTILE_SITE_KEY);
          }}
          theme="dark"
        />
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
            window.location.href = `${API_URL}/auth/google`;
          }}
          className="p-2 rounded-md bg-white hover:opacity-90 transition-opacity"
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
          onClick={() => {
            window.location.href = `${API_URL}/auth/facebook`;
          }}
          className="p-2 rounded-md bg-[#1877F2] hover:opacity-90 transition-opacity"
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
      <OtpModal
        isOpen={showLoginOtpModal}
        onClose={() => setShowLoginOtpModal(false)}
        title="Nhập mã OTP"
        message="Vui lòng nhập mã OTP đã gửi tới email để hoàn tất đăng nhập"
        loading={otpLoading}
        onConfirm={handleLoginOtpConfirm}
            onResend={async () => {
          try {
            setOtpLoading(true);
            const targetEmail = twoFactorEmail || formData.email;
            await authService.sendOtp(targetEmail, 'login');
            showSuccess('OTP đã gửi lại tới email');
          } catch (e) {
            console.error('resend email otp error', e);
            showError('Không thể gửi lại mã OTP qua email');
          } finally {
            setOtpLoading(false);
          }
        }}
        resendLabel="Gửi lại email"
      />
      <OtpModal
        isOpen={showLoginTotpModal}
        onClose={() => setShowLoginTotpModal(false)}
        title="Nhập mã Authenticator"
        message="Nhập mã 6 chữ số từ ứng dụng Authenticator của bạn."
        loading={totpLoading || emailFallbackLoading}
        onConfirm={handleLoginTotpConfirm}
        {...(hasEmail
          ? {
              onResend: async () => {
                try {
                  setEmailFallbackLoading(true);
                  const targetEmail = twoFactorEmail || formData.email;
                  await authService.sendOtp(targetEmail, 'login');
                  showSuccess('OTP đã gửi qua email');
                  setShowLoginTotpModal(false);
                  setShowLoginOtpModal(true);
                } catch (e) {
                  console.error('sendOtp fallback error', e);
                  showError('Không thể gửi OTP qua email');
                } finally {
                  setEmailFallbackLoading(false);
                }
              },
              resendLabel: 'Xác minh qua email',
            }
          : {})}
      />
    </form>
  );
};