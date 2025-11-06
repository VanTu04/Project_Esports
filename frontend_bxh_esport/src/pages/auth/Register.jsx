import { Link } from 'react-router-dom';
import { RegisterForm } from '../../components/auth/RegisterForm';

export const Register = () => {
  return (
    <div className="min-h-screen bg-dark-500 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Đăng ký</h1>
          <p className="text-gray-400">Tạo tài khoản mới</p>
        </div>

        <div className="bg-dark-400 border border-primary-700/30 rounded-lg p-8">
          <RegisterForm />
          
          <div className="mt-6 text-center text-sm text-gray-400">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary-500 hover:text-primary-400">
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};