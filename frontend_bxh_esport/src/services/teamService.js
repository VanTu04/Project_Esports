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

  getTeamMembers: async (teamId) => {
    try {
      // use constant template if present, otherwise fallback
      const endpoint = API_ENDPOINTS.TEAM_MEMBERS ? build(API_ENDPOINTS.TEAM_MEMBERS, teamId) : `${API_ENDPOINTS.TEAMS}/${teamId}/members`;
      return await apiClient.get(endpoint);
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
      const endpoint = API_ENDPOINTS.TEAM_INVITATIONS ? build(API_ENDPOINTS.TEAM_INVITATIONS, teamId) : `${API_ENDPOINTS.TEAMS}/${teamId}/invites`;
      return await apiClient.post(endpoint, { userId });
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
};

export default teamService;
