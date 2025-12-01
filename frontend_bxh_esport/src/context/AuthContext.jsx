import React, { createContext, useState, useEffect, useContext } from "react";
import authService from "../services/authService";
import { STORAGE_KEYS } from "../utils/constants";
import storage from "../utils/storage";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Khi app khởi chạy → lấy user info từ storage
  useEffect(() => {
    const savedUser = storage.getItem(STORAGE_KEYS.USER_DATA);

    if (savedUser) {
      try {
        setUser(typeof savedUser === "string" ? JSON.parse(savedUser) : savedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error parsing saved user:", error);
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
      // authService.login sẽ gọi API /login, backend trả JWT HttpOnly cookie
      const response = await authService.login(credentials);

      console.log("Login response:", response);

      if (response?.code === 0 && response?.data?.user) {
        const userInfo = response.data.user;

        // Lưu user info vào storage và state
        setUser(userInfo);
        setIsAuthenticated(true);
        storage.setItem(STORAGE_KEYS.USER_DATA, userInfo);
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
      const userInfo = response?.data?.user;

      if (userInfo) {
        setUser(userInfo);
        setIsAuthenticated(true);
        storage.setItem(STORAGE_KEYS.USER_DATA, userInfo);
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
      await authService.logout(); // backend xóa cookie
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      storage.removeItem(STORAGE_KEYS.USER_DATA);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // ==================== UPDATE USER ==================== //
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    storage.setItem(STORAGE_KEYS.USER_DATA, updatedUser);
  };
  
  // Also expose a helper to mark user as authenticated (used after 2FA confirm)
  const markAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
    markAuthenticated,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export default AuthContext;
