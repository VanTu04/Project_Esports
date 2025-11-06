// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import authService from "../services/authService";
import { STORAGE_KEYS } from "../utils/constants";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Khi app khởi chạy → kiểm tra token trong localStorage
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }

    setLoading(false);
  }, []);

  // ==================== LOGIN ==================== //
  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);

      const token = response?.data?.accessToken;
      const userInfo = response?.data?.user;

      if (token) {
        // Lưu token vào localStorage
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

        if (userInfo) {
          // Nếu API trả user
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userInfo));
          setUser(userInfo);
        } else {
          // Nếu API chỉ trả token mà không có user
          const basicUser = { email: credentials.email };
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(basicUser));
          setUser(basicUser);
        }

        setIsAuthenticated(true);
      }

      return response;
    } catch (error) {
      console.error("Login error:", error);
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
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userInfo));
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
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // ==================== UPDATE USER ==================== //
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
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
