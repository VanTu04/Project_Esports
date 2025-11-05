import React from 'react';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  return (
    <div className="min-h-screen bg-dark-500 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Quên mật khẩu</h1>
          <p className="text-gray-400">Nhập email để nhận hướng dẫn đặt lại mật khẩu</p>
        </div>

        <div className="bg-dark-400 border border-primary-700/30 rounded-lg p-8">
          <ForgotPasswordForm />

          <div className="mt-6 text-center text-sm text-gray-400">
            Bạn nhớ mật khẩu?{' '}
            <Link to="/login" className="text-primary-500 hover:text-primary-400">
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
