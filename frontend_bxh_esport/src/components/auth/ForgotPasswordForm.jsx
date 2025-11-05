import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // thêm import này
import { useNotification } from '../../context/NotificationContext';
import { validateForm } from '../../utils/validators';
import Button from '../common/Button';
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
      setStep(2);
    } catch (error) {
      showError(error.response?.data?.message || 'Lỗi gửi OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm(formData, {
      otp: { required: true },
    });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await authService.checkOtp(formData.email, formData.otp);
      showSuccess('OTP hợp lệ!');
      setStep(3);
    } catch (error) {
      showError(error.response?.data?.message || 'OTP không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm(formData, {
      password: { required: true, minLength: 6 },
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
      navigate('/login'); // chuyển hướng về trang login
    } catch (error) {
      showError(error.response?.data?.message || 'Lỗi đặt lại mật khẩu');
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nhập mã OTP
            </label>
            <input
              type="text"
              name="otp"
              value={formData.otp}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-dark-400 border border-primary-700/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.otp && (
              <p className="mt-1 text-sm text-red-500">{errors.otp}</p>
            )}
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
