  import { Link } from 'react-router-dom';
  import { LoginForm } from '../../components/auth/LoginForm';

  export const Login = () => {
    return (
      <div className="min-h-screen bg-dark-500 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Đăng nhập</h1>
            <p className="text-gray-400">Chào mừng trở lại!</p>
          </div>

          <div className="bg-dark-400 border border-primary-700/30 rounded-lg p-8">
            <LoginForm />
            
            <div className="mt-6 text-center text-sm text-gray-400">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-primary-500 hover:text-primary-400">
                Đăng ký ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };