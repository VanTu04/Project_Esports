import { apiClient } from './api';
import { API_ENDPOINTS } from '../utils/constants';

// Frontend user service for profile and admin user operations.
const userService = {
  // Get profile: backend returns { code:0, status, message, data: user }
  getProfile: async (opts = {}) => {
    // opts can be { token, baseUrl }
    try {
      // use axios instance which already sets withCredentials
      const res = await apiClient.get('/users/profile');
      // axios response in res.data
      const payload = res && res.data ? res.data : res;
      // normalized: if payload.data exists, take payload.data, else payload
      const data = payload && payload.data ? payload.data : payload;

      // Normalize avatar URL: handle several backend shapes and malformed values
      if (data && data.avatar && typeof data.avatar === 'string') {
        let avatar = data.avatar.trim();

        // Fix common typo: 'http//...' -> 'http://...'
        avatar = avatar.replace(/^http:\/\//i, (m) => m); // noop to keep proper http://
        avatar = avatar.replace(/^http\/\//i, 'http://');

        // If avatar contains multiple 'http' occurrences due to double-prefixing
        // (e.g. 'https://api.vawndev.onlinehttp://localhost:8081/uploads/...'),
        // use the last occurrence (most specific full URL).
        const idx = avatar.toLowerCase().lastIndexOf('http');
        if (idx > 0) {
          avatar = avatar.substring(idx);
        }

        // If still not an absolute URL, prefix with VITE_API_BACKEND if available
        if (!/^https?:\/\//i.test(avatar)) {
          const backend = import.meta.env.VITE_API_BACKEND || '';
          avatar = `${backend.replace(/\/$/, '')}${avatar}`;
        }

        data.avatar = avatar;
      }

      return data;
    } catch (error) {
      console.error('userService.getProfile error', error);
      throw error;
    }
  },

  // Update profile (JSON) - rarely used by backend in this project
  updateProfile: async (payload) => {
    try {
      const res = await apiClient.put('/users/update-profile', payload);
      return res.data || res;
    } catch (error) {
      console.error('userService.updateProfile error', error);
      throw error;
    }
  },

  // Update profile with avatar (multipart/form-data)
  updateProfileForm: async (fields = {}, avatarFile = null, bannerFile = null) => {
    try {
      const form = new FormData();
      if (fields.full_name !== undefined) form.append('full_name', fields.full_name);
      if (fields.phone !== undefined) form.append('phone', fields.phone);
      if (avatarFile) form.append('avatar', avatarFile);
      if (bannerFile) form.append('banner', bannerFile);

      const res = await apiClient.post('/users/update-profile', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data || res;
    } catch (error) {
      console.error('userService.updateProfileForm error', error);
      throw error;
    }
  },

  // Check exist email
  checkExistEmail: async (email) => {
    try {
      const res = await apiClient.post('/users/check-exist-email', { email });
      return res.data || res;
    } catch (error) {
      throw error;
    }
  },

  checkExistUsername: async (username) => {
    try {
      const res = await apiClient.post('/users/check-exist-username', { username });
      return res.data || res;
    } catch (error) {
      throw error;
    }
  },

  // Admin: get all users
  getAllUsers: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS, { params });
      const payload = response && response.data ? response.data : response;

      if (Array.isArray(payload)) return payload;
      if (payload && Array.isArray(payload.users)) return payload.users;
      if (payload && payload.data && Array.isArray(payload.data.users)) return payload.data.users;

      return [];
    } catch (error) {
      console.error('getAllUsers error:', error);
      throw error;
    }
  },

  toggleBanUser: async (userId, banned) => {
    try {
      return await apiClient.put(`${API_ENDPOINTS.USERS}/${userId}/ban`, { banned });
    } catch (error) {
      throw error;
    }
  },

  addTeamToUser: async (userId, teamData) => {
    try {
      return await apiClient.post(`${API_ENDPOINTS.USERS}/${userId}/team`, teamData);
    } catch (error) {
      throw error;
    }
  },
  // Change password: { current_password, new_password }
  changePassword: async (payload) => {
    try {
      const res = await apiClient.post('/users/change-password', payload);
      return res.data || res;
    } catch (error) {
      console.error('userService.changePassword error', error);
      throw error;
    }
  },

  // Enable/disable two-factor auth
  setTwoFactor: async (enabled) => {
    try {
      const res = await apiClient.post('/users/two-factor', { enabled });
      return res.data || res;
    } catch (error) {
      console.error('userService.setTwoFactor error', error);
      throw error;
    }
  },

  // Delete current authenticated account
  deleteAccount: async () => {
    try {
      // Common pattern: backend may expose DELETE /users or /users/me
      // Try DELETE /users first (many backends map to current user), fallback not implemented.
      const res = await apiClient.delete('/users');
      return res.data || res;
    } catch (error) {
      console.error('userService.deleteAccount error', error);
      throw error;
    }
  },

  // Get wallet balance from backend
  getWalletBalance: async () => {
    try {
      const res = await apiClient.get('/wallet/balance');
      const payload = res && res.data ? res.data : res;
      // Try common shapes: { data: { balance } } or { balance }
      if (payload && payload.data && payload.data.balance !== undefined) return payload.data.balance;
      if (payload && payload.balance !== undefined) return payload.balance;
      return payload;
    } catch (error) {
      console.error('userService.getWalletBalance error', error);
      throw error;
    }
  },
};

export default userService;

// Named exports for convenience
export const getProfile = userService.getProfile;
export const updateProfile = userService.updateProfile;
export const updateProfileForm = userService.updateProfileForm;