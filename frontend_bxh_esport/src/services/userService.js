import { apiClient } from './api';
import { API_ENDPOINTS } from '../utils/constants';

const build = (template, id) => template.replace(':id', id);

const userService = {
  updateUser: async (userId, data) => {
    try {
      return await apiClient.put(`${API_ENDPOINTS.USERS}/${userId}`, data);
    } catch (error) {
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      return await apiClient.delete(`${API_ENDPOINTS.USERS}/${userId}`);
    } catch (error) {
      throw error;
    }
  },
  
  // Check if username exists
  checkExistUsername: async (username) => {
    try {
      return await apiClient.post(`${API_ENDPOINTS.USERS}/check-exist-username`, { username });
    } catch (error) {
      throw error;
    }
  },
  
  // Check if email exists
  checkExistEmail: async (email) => {
    try {
      return await apiClient.post(`${API_ENDPOINTS.USERS}/check-exist-email`, { email });
    } catch (error) {
      throw error;
    }
  },
  
  // Create account by admin
  createAccountByAdmin: async (data) => {
    try {
      const response = await apiClient.post(`${API_ENDPOINTS.USERS}/new-account`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get all users (Admin only)
  getAllUsers: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS, { params });
      console.log('📥 Response từ API getAllUsers:', response);
      // Backend trả về format: { code: 0, status: 200, message: "...", data: { users: [...] } }
      return response.data || response; // Trả về data.users hoặc toàn bộ response
    } catch (error) {
      console.error('❌ Error trong getAllUsers service:', error);
      throw error;
    }
  },

  // TODO: Backend chưa có - Toggle ban user
  toggleBanUser: async (userId, banned) => {
    try {
      return await apiClient.put(`${API_ENDPOINTS.USERS}/${userId}/ban`, { banned });
    } catch (error) {
      throw error;
    }
  },

  // TODO: Backend chưa có - Add team to user
  addTeamToUser: async (userId, teamData) => {
    try {
      return await apiClient.post(`${API_ENDPOINTS.USERS}/${userId}/team`, teamData);
    } catch (error) {
      throw error;
    }
  }
};

export default userService;