import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import { USER_ROLES } from '../../utils/constants';
import { useNotification } from '../../context/NotificationContext';

export default function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    setForm({
      full_name: user.full_name || '',
      username: user.username || '',
      email: user.email || '',
      role: user.role || USER_ROLES.USER,
      status: user.status ?? 1,
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear errors khi user thay đổi
    if (name === 'username') {
      setUsernameError('');
    }
    if (name === 'email') {
      setEmailError('');
    }
  };

  // Check username khi blur (chỉ check nếu thay đổi)
  const handleUsernameBlur = async () => {
    if (!form.username || form.username === user.username) return;
    
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

  // Check email khi blur (chỉ check nếu thay đổi)
  const handleEmailBlur = async () => {
    if (!form.email || form.email === user.email) return;
    
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

  const handleSave = async () => {
    setError(null);

    // Validation
    if (!form.username) {
      setError('Username không được để trống.');
      return;
    }

    if (usernameError) {
      setError('Vui lòng sửa lỗi username trước khi lưu.');
      return;
    }

    if (form.email && emailError) {
      setError('Vui lòng sửa lỗi email trước khi lưu.');
      return;
    }

    try {
      setSaving(true);
      await userService.updateUser(user.id, form);
      showSuccess('Cập nhật người dùng thành công');
      onSaved();
    } catch (err) {
      console.error('Update user error:', err);
      const message = err?.message || err?.error || 'Lỗi khi cập nhật người dùng';
      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Chỉnh sửa người dùng
      </h3>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Username *
          </label>
          <input 
            name="username" 
            value={form.username || ''} 
            onChange={handleChange}
            onBlur={handleUsernameBlur}
            className={`mt-1 w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
          {!usernameError && form.username && form.username !== user.username && !usernameChecking && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Username khả dụng</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Full name
          </label>
          <input 
            name="full_name" 
            value={form.full_name || ''} 
            onChange={handleChange} 
            className="mt-1 w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input 
          name="email" 
          type="email"
          value={form.email || ''} 
          onChange={handleChange}
          onBlur={handleEmailBlur}
          className={`mt-1 w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            emailError ? 'border-red-500' : ''
          }`}
        />
        {emailChecking && (
          <p className="text-xs text-gray-500 mt-1">Đang kiểm tra...</p>
        )}
        {emailError && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{emailError}</p>
        )}
        {!emailError && form.email && form.email !== user.email && !emailChecking && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Email khả dụng</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Role *
          </label>
          <select 
            name="role" 
            value={form.role || USER_ROLES.USER} 
            onChange={handleChange} 
            className="mt-1 w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={USER_ROLES.USER}>User</option>
            <option value={USER_ROLES.PLAYER}>Player</option>
            <option value={USER_ROLES.TEAM_MANAGER}>Team Manager</option>
            <option value={USER_ROLES.ADMIN}>Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status *
          </label>
          <select 
            name="status" 
            value={form.status ?? 1} 
            onChange={handleChange} 
            className="mt-1 w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={1}>Active</option>
            <option value={0}>Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button 
          onClick={onClose} 
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Hủy
        </button>
        <button 
          onClick={handleSave} 
          disabled={saving || usernameChecking || emailChecking || !!usernameError || !!emailError} 
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  );
}
