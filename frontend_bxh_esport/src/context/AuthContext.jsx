// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import authService from "../services/authService";
import { STORAGE_KEYS } from "../utils/constants";
import storage from "../utils/storage";
import userService from "../services/userService";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Khi app khởi chạy → kiểm tra token trong sessionStorage
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (!token) return;

        const res = await userService.getProfile();
        
        if (res?.data) {
          const profile = res.data.data || res.data;

          setUser(profile);
          setIsAuthenticated(true);

          storage.setItem(STORAGE_KEYS.USER_DATA, profile);
        }
      } catch (error) {
        console.error("Load profile error:", error);
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    fetchProfile();
    
    const token = storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const savedUser = storage.getItem(STORAGE_KEYS.USER_DATA);

    if (token && savedUser) {
      try {
        setUser(typeof savedUser === 'string' ? JSON.parse(savedUser) : savedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        storage.removeItem(STORAGE_KEYS.USER_DATA);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }

    setLoading(false);
  }, []);

  // ==================== LOGIN ==================== //
  const login = async (credentials) => {
    try {
      // Sử dụng authService thay vì api trực tiếp
      const response = await authService.login(credentials);
      
      console.log('Login response:', response);
      
      if (response?.code === 0 && response?.data?.accessToken) {
        const { accessToken, refreshToken } = response.data;
        
        // Lưu token vào sessionStorage (mất khi đóng trình duyệt)
        storage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
        if (refreshToken) {
          storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }
        
        // Decode token và lấy thông tin user
        const decodedToken = decodeJWT(accessToken);
        console.log('Decoded token in AuthContext:', decodedToken);
        
        const userData = {
          id: decodedToken.id,
          username: decodedToken.username,
          email: decodedToken.email,
          role: decodedToken.role,
          avatar: decodedToken.avatar,
          wallet_address: decodedToken.wallet_address,
          phone: decodedToken.phone,
          gender: decodedToken.gender,
          created_at: decodedToken.created_at,
          full_name: decodedToken.full_name,
        };
        
        
        setUser(userData);
        setIsAuthenticated(true);
        
        storage.setItem(STORAGE_KEYS.USER_DATA, userData);
      }
      
      return response;
    } catch (error) {
      console.error("Login error in AuthContext:", error);
      throw error;
    }
  };

  // ==================== REGISTER ==================== //
  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const token = response?.data?.accessToken;
      const userInfo = response?.data?.user;

      if (token && userInfo) {
        storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        storage.setItem(STORAGE_KEYS.USER_DATA, userInfo);
        setUser(userInfo);
        setIsAuthenticated(true);
      }

      return response;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };

  // ==================== LOGOUT ==================== //
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      storage.removeItem(STORAGE_KEYS.USER_DATA);
      storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // ==================== UPDATE USER ==================== //
  const updateUser = (newData) => {
    const updated = { ...user, ...newData };
    setUser(updated);

    // cập nhật vào localStorage để dùng lại khi reload
    storage.setItem(STORAGE_KEYS.USER_DATA, updated);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;