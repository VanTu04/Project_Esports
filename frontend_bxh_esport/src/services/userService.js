import { apiClient } from './api';
import { USE_MOCK_API } from '../config';
import { mockUserService } from '../mock/mockServices';

const userService = {
  getAllUsers: async (params = {}) => {
    if (USE_MOCK_API) {
      return await mockUserService.getAllUsers(params);
    }
    try {
      const response = await apiClient.get('/users', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  getUserById: async (userId) => {
    if (USE_MOCK_API) {
      return await mockUserService.getUserById(userId);
    }
    try {
      const response = await apiClient.get(`/users/${userId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getFavoriteTeams: async (userId) => {
    if (USE_MOCK_API) {
      return await mockUserService.getFavoriteTeams(userId);
    }
    try {
      const response = await apiClient.get(`/users/${userId}/favorites`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getNotifications: async (userId, params = {}) => {
    if (USE_MOCK_API) {
      return await mockUserService.getNotifications(userId, params);
    }
    try {
      const response = await apiClient.get(`/users/${userId}/notifications`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Các methods khác tương tự...
};

export default userService;

