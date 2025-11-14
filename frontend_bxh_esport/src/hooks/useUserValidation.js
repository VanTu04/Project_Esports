import { useState } from 'react';
import userService from '../services/userService';

export const useUserValidation = () => {
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const checkEmailExists = async (email) => {
    if (!email) return null;

    // Kiểm tra format email trước
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Email không hợp lệ';
    }

    // Gọi API check trùng
    setCheckingEmail(true);
    try {
      const result = await userService.checkExistEmail(email);
      
      if (result?.data?.exists) {
        return 'Email này đã tồn tại';
      }
      return null;
    } catch (error) {
      console.error('Check email error:', error);
      return null;
    } finally {
      setCheckingEmail(false);
    }
  };

  const checkUsernameExists = async (username) => {
    if (!username) return null;

    // Kiểm tra độ dài tối thiểu
    if (username.length < 3) {
      return 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }

    // Gọi API check trùng
    setCheckingUsername(true);
    try {
      const result = await userService.checkExistUsername(username);
      
      if (result?.data?.exists) {
        return 'Username này đã tồn tại';
      }
      return null;
    } catch (error) {
      console.error('Check username error:', error);
      return null;
    } finally {
      setCheckingUsername(false);
    }
  };

  return {
    checkingEmail,
    checkingUsername,
    checkEmailExists,
    checkUsernameExists,
  };
};
