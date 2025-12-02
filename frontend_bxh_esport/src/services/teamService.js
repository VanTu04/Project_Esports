import { apiClient } from './api';
import { API_ENDPOINTS } from '../utils/constants';

const build = (template, id) => template.replace(':id', id);

const teamService = {
  getAllTeams: async (params = {}) => {
    try {
      return await apiClient.get(API_ENDPOINTS.TEAMS, { params });
    } catch (error) {
      throw error;
    }
  },

  getTeamById: async (teamId) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.TEAMS}/${teamId}`);
    } catch (error) {
      throw error;
    }
  },

  getTeamByUserId: async (userId) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.TEAMS}/user/${userId}`);
    } catch (error) {
      throw error;
    }
  },

  getTeamMembers: async (teamId) => {
    try {
      // Backend doesn't have team members endpoint yet
      // TODO: Implement backend endpoint
      return { data: [] };
    } catch (error) {
      throw error;
    }
  },

  getTeamRankings: async (params = {}) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.TEAMS}/rankings`, { params });
    } catch (error) {
      throw error;
    }
  },

  invitePlayer: async (teamId, userId) => {
    try {
      // Backend doesn't have team invitations endpoint yet
      // TODO: Implement backend endpoint
      return { data: null };
    } catch (error) {
      throw error;
    }
  },

  removePlayer: async (teamId, playerId) => {
    try {
      return await apiClient.delete(`${API_ENDPOINTS.TEAMS}/${teamId}/members/${playerId}`);
    } catch (error) {
      throw error;
    }
  },

  getTeamMatches: async (teamId, params = {}) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.TEAMS}/${teamId}/matches`, { params });
    } catch (error) {
      throw error;
    }
  },

  createTeam: async (newTeam) => {
    try {
      return await apiClient.post(API_ENDPOINTS.TEAMS, newTeam);
    } catch (error) {
      throw error;
    }
  },

  updateTeam: async (id, updatedData) => {
    try {
      return await apiClient.put(`${API_ENDPOINTS.TEAMS}/${id}`, updatedData);
    } catch (error) {
      throw error;
    }
  },

  deleteTeam: async (id) => {
    try {
      return await apiClient.delete(`${API_ENDPOINTS.TEAMS}/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // Get top teams (leaderboard)
  getTopTeams: async (limit = 10) => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.TEAMS}/rankings`, { 
        params: { limit, sortBy: 'points', order: 'desc' } 
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get top teams by wins
  getTopTeamsByWins: async (limit = 5) => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.TEAMS}/top/wins`, { 
        params: { limit } 
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default teamService;
