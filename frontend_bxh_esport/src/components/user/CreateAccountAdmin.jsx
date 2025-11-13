import { useState } from 'react';
import userService from '../../services/userService';
import { USER_ROLES } from '../../utils/constants';
import { useNotification } from '../../context/NotificationContext';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function CreateAccountAdmin({ onClose, onCreated }) {
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
      

      const res = await userService.createAccountByAdmin(payload);
      
      
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
    <Modal isOpen={true} title="Tạo tài khoản mới" onClose={onClose} size="lg">
      {error && (
        <div className="text-sm text-red-400 mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Tên đăng nhập *
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
              Họ và tên
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
            Email*
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
              <option value={USER_ROLES.TEAM_MANAGER}>Team Manager</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading || usernameChecking || emailChecking || !!usernameError || !!emailError}
          >
            Tạo tài khoản
          </Button>
        </div>
      </form>
    </Modal>
  );
}