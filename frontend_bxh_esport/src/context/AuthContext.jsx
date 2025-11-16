// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import authService from "../services/authService";
import { apiClient } from "../services/api"; // ← THÊM DÒNG NÀY
import { STORAGE_KEYS } from "../utils/constants";
import storage from "../utils/storage";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Khi app khởi chạy → kiểm tra user từ cookie
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.get('/users/me');
        const userInfo = res?.data?.user || res?.data;
        
        if (userInfo) {
          setUser(userInfo);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.log('Not authenticated yet');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // ==================== LOGIN ==================== //
  const login = async (credentials) => {
    const res = await authService.login(credentials);
    
    // Lấy thông tin user từ response
    const userInfo = res?.data?.user || res?.data;
    
    if (userInfo) {
      setUser(userInfo);
      setIsAuthenticated(true);
    }
    
    return res;
  };

  // ==================== REGISTER ==================== //
  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const payload = response?.data ?? response;
      const userInfo = payload?.user || payload?.userInfo || payload;

      if (userInfo) {
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
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    storage.setItem(STORAGE_KEYS.USER_DATA, updatedUser);
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