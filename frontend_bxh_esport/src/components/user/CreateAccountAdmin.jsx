import { useState } from 'react';
import userService from '../../services/userService';
import { USER_ROLES } from '../../utils/constants';
import { useNotification } from '../../context/NotificationContext';

export default function CreateAccountAdmin({ onCreated }) {
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirm_password: '',
    full_name: '',
    team_name: '',
    role: USER_ROLES.USER,
    status: 1,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { showSuccess, showError } = useNotification();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear errors khi user thay đổi
    if (name === 'username') {
      setUsernameError('');
    }
    if (name === 'email') {
      setEmailError('');
    }
  };

  // Check username khi blur
  const handleUsernameBlur = async () => {
    if (!form.username) return;
    
    try {
      setUsernameChecking(true);
      const result = await userService.checkExistUsername(form.username);
      
      if (result?.data?.exists) {
        setUsernameError('Username này đã tồn tại');
      } else {
        setUsernameError('');
      }
    } catch (err) {
      console.error('Check username error:', err);
    } finally {
      setUsernameChecking(false);
    }
  };

  // Check email khi blur
  const handleEmailBlur = async () => {
    if (!form.email) return;
    
    try {
      setEmailChecking(true);
      const result = await userService.checkExistEmail(form.email);
      
      if (result?.data?.exists) {
        setEmailError('Email này đã tồn tại');
      } else {
        setEmailError('');
      }
    } catch (err) {
      console.error('Check email error:', err);
    } finally {
      setEmailChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!form.username) {
      setError('Username không được để trống.');
      return;
    }

    if (usernameError) {
      setError('Vui lòng sửa lỗi username trước khi tiếp tục.');
      return;
    }

    if (form.email && emailError) {
      setError('Vui lòng sửa lỗi email trước khi tiếp tục.');
      return;
    }

    if (!form.password) {
      setError('Password không được để trống.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password phải có ít nhất 6 ký tự.');
      return;
    }

    if (form.password !== form.confirm_password) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp.');
      return;
    }

    try {
      setLoading(true);
      
      // Send the full form data (including confirm_password)
      // Backend expects confirm_password for validation
      const payload = { ...form };
      
      console.log('Sending payload:', payload); // Debug log

      const res = await userService.createAccountByAdmin(payload);
      
      console.log('Response:', res); // Debug log
      
      if (onCreated) onCreated(res);
      showSuccess('Tạo tài khoản thành công');
      
      // Reset form
      setForm({ 
        username: '', 
        password: '', 
        confirm_password: '', 
        full_name: '', 
        team_name: '', 
        role: USER_ROLES.USER, 
        status: 1 
      });
    } catch (err) {
      console.error('Create account error:', err);
      
      // Better error message extraction
      const message = err?.message || 
                      err?.error || 
                      err?.data?.message || 
                      'Lỗi tạo tài khoản';
      
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 w-full max-w-xl">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Tạo tài khoản mới (Admin)
      </h3>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Username *
            </label>
            <input 
              name="username" 
              value={form.username} 
              onChange={handleChange}
              onBlur={handleUsernameBlur}
              className={`mt-1 w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                usernameError ? 'border-red-500' : ''
              }`}
              required
            />
            {usernameChecking && (
              <p className="text-xs text-gray-500 mt-1">Đang kiểm tra...</p>
            )}
            {usernameError && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{usernameError}</p>
            )}
            {!usernameError && form.username && !usernameChecking && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Username khả dụng</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Full name
            </label>
            <input 
              name="full_name" 
              value={form.full_name} 
              onChange={handleChange} 
              className="mt-1 w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            Email (optional)
          </label>
          <input 
            name="email" 
            type="email"
            value={form.email || ''} 
            onChange={handleChange}
            onBlur={handleEmailBlur}
            className={`mt-1 w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              emailError ? 'border-red-500' : ''
            }`}
          />
          {emailChecking && (
            <p className="text-xs text-gray-500 mt-1">Đang kiểm tra...</p>
          )}
          {emailError && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{emailError}</p>
          )}
          {!emailError && form.email && !emailChecking && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Email khả dụng</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Password *
            </label>
            <input 
              name="password" 
              type="password" 
              value={form.password} 
              onChange={handleChange} 
              className="mt-1 w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Confirm password *
            </label>
            <input 
              name="confirm_password" 
              type="password" 
              value={form.confirm_password} 
              onChange={handleChange} 
              className="mt-1 w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              required
              minLength={6}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            Team name (optional)
          </label>
          <input 
            name="team_name" 
            value={form.team_name} 
            onChange={handleChange} 
            className="mt-1 w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Role *
            </label>
            <select 
              name="role" 
              value={form.role} 
              onChange={handleChange} 
              className="mt-1 w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value={USER_ROLES.USER}>User</option>
              <option value={USER_ROLES.PLAYER}>Player</option>
              <option value={USER_ROLES.TEAM_MANAGER}>Team Manager</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={loading || usernameChecking || emailChecking || !!usernameError || !!emailError} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>
    </div>
  );
}