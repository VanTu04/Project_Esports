import React, { useState, useEffect } from 'react'; // thêm import này
import { useNavigate } from 'react-router-dom'; // thêm import này
import { useNotification } from '../../context/NotificationContext';
import { validateForm } from '../../utils/validators';
import Button from '../common/Button';
// PasswordRequirements removed per request
import authService from '../../services/authService';

const ForgotPasswordForm = () => {
  const navigate = useNavigate(); // thêm hook này
  const { showSuccess, showError } = useNotification();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  // OTP input as 6 digits
  const [otpDigits, setOtpDigits] = useState(new Array(6).fill(''));
  const otpInputsRef = [];

  useEffect(() => {
    if (step === 2) {
      // focus first OTP input when moving to step 2
      const ref = otpInputsRef[0];
      if (ref && ref.focus) setTimeout(() => ref.focus(), 50);
    }
  }, [step]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm(formData, {
      email: { required: true, email: true },
    });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await authService.sendOtp(formData.email);
      showSuccess('OTP đã được gửi đến email của bạn!');
      setOtpDigits(new Array(6).fill(''));
      setStep(2);
    } catch (error) {
      showError(error?.message ||error.response?.data?.message || 'Lỗi gửi OTP');
    } finally {
      setLoading(false);
    }
  };

  const focusOtpInput = (index) => {
    const ref = otpInputsRef[index];
    if (ref && ref.focus) ref.focus();
  };

  const handleOtpChange = (index, value) => {
    const v = value.replace(/[^0-9]/g, '');
    const digits = [...otpDigits];
    digits[index] = v ? v.charAt(v.length - 1) : '';
    setOtpDigits(digits);
    if (v && index < 5) focusOtpInput(index + 1);
    if (errors.otp) setErrors((prev) => ({ ...prev, otp: '' }));
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index]) {
        const digits = [...otpDigits];
        digits[index] = '';
        setOtpDigits(digits);
      } else if (index > 0) {
        focusOtpInput(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusOtpInput(index - 1);
    } else if (e.key === 'ArrowRight' && index < 5) {
      focusOtpInput(index + 1);
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
    if (!paste) return;
    const chars = paste.split('').slice(0, 6);
    const digits = new Array(6).fill('');
    for (let i = 0; i < chars.length; i++) digits[i] = chars[i];
    setOtpDigits(digits);
    const nextIndex = Math.min(chars.length, 5);
    focusOtpInput(nextIndex);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length < 6) {
      setErrors({ otp: 'Vui lòng nhập đủ 6 chữ số OTP' });
      return;
    }

    setLoading(true);
    try {
      const response = await authService.checkOtp(formData.email, otp);
      showSuccess(response.message || 'OTP hợp lệ!');
      setStep(3);
    } catch (error) {
      showError(error?.message || error?.response?.data?.message || 'OTP không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

const handleResetPassword = async (e) => {
  e.preventDefault();

  const validationErrors = validateForm(formData, {
    password: { required: true, password: true },
  });
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }

  setLoading(true);
  try {
    await authService.resetPassword(formData.email, formData.password);
    showSuccess('Đặt lại mật khẩu thành công!');
    setStep(1);
    setFormData({ email: '', otp: '', password: '' });
    setOtpDigits(new Array(6).fill(''));
    navigate('/login');
  } catch (error) {
    showError(error?.message || error?.response?.data?.message || 'Lỗi đặt lại mật khẩu');
  } finally {
    setLoading(false);
  }
};

  return (
    <form className="space-y-4">
      {step === 1 && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nhập email
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

          <Button onClick={handleSendOtp} fullWidth loading={loading}>
            Gửi mã OTP
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nhập mã OTP</label>
            <div className="flex gap-2 justify-center">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { otpInputsRef[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(e, i)}
                  onPaste={handleOtpPaste}
                  className="w-12 h-12 text-center text-lg rounded border bg-dark-400 text-white"
                />
              ))}
            </div>
            {errors.otp && <p className="mt-1 text-sm text-red-500">{errors.otp}</p>}
          </div>

          <Button onClick={handleVerifyOtp} fullWidth loading={loading}>
            Xác nhận OTP
          </Button>
        </>
      )}

      {step === 3 && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nhập mật khẩu mới
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-dark-400 border border-primary-700/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-gray-400">Mật khẩu ít nhất 8 ký tự, gồm chữ in hoa, chữ thường, số và ký tự đặc biệt</p>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          <Button onClick={handleResetPassword} fullWidth loading={loading}>
            Đặt lại mật khẩu
          </Button>
        </>
      )}
    </form>
  );
};

export default ForgotPasswordForm;
