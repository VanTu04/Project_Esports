import { apiClient } from './api';
import { USE_MOCK_API } from '../config';
import { mockTeamService } from '../mock/mockServices';

const teamService = {
  getAllTeams: async (params = {}) => {
    if (USE_MOCK_API) return await mockTeamService.getAllTeams(params);
    try {
      const response = await apiClient.get('/teams', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  getTeamById: async (teamId) => {
    if (USE_MOCK_API) return await mockTeamService.getTeamById(teamId);
    try {
      const response = await apiClient.get(`/teams/${teamId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getTeamMembers: async (teamId) => {
    if (USE_MOCK_API) return await mockTeamService.getTeamMembers(teamId);
    try {
      const response = await apiClient.get(`/teams/${teamId}/members`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getTeamRankings: async (params = {}) => {
    if (USE_MOCK_API) return await mockTeamService.getTeamRankings(params);
    try {
      const response = await apiClient.get('/teams/rankings', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  invitePlayer: async (teamId, userId) => {
    if (USE_MOCK_API) return await mockTeamService.invitePlayer(teamId, userId);
    try {
      const response = await apiClient.post(`/teams/${teamId}/invites`, { userId });
      return response;
    } catch (error) {
      throw error;
    }
  },

  removePlayer: async (teamId, playerId) => {
    if (USE_MOCK_API) return await mockTeamService.removePlayer(teamId, playerId);
    try {
      const response = await apiClient.delete(`/teams/${teamId}/members/${playerId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getTeamMatches: async (teamId, params = {}) => {
    if (USE_MOCK_API) return await mockTeamService.getTeamMatches(teamId, params);
    try {
      const response = await apiClient.get(`/teams/${teamId}/matches`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // ✅ Sửa 3 hàm dưới: gọi mockTeamService thay vì dùng biến 'teams' chưa định nghĩa
  createTeam: async (newTeam) => {
    if (USE_MOCK_API) return await mockTeamService.createTeam(newTeam);
    try {
      const response = await apiClient.post('/teams', newTeam);
      return response;
    } catch (error) {
      throw error;
    }
  },

  updateTeam: async (id, updatedData) => {
    if (USE_MOCK_API) return await mockTeamService.updateTeam(id, updatedData);
    try {
      const response = await apiClient.put(`/teams/${id}`, updatedData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  deleteTeam: async (id) => {
    if (USE_MOCK_API) return await mockTeamService.deleteTeam(id);
    try {
      const response = await apiClient.delete(`/teams/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default teamService;
