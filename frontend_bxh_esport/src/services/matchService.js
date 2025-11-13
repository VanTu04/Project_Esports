import { apiClient } from './api';
import { API_ENDPOINTS } from '../utils/constants';

const build = (template, id) => template.replace(':id', id);

const matchService = {
  getAllMatches: async (params = {}) => {
    try {
      return await apiClient.get(API_ENDPOINTS.MATCHES, { params });
    } catch (error) {
      throw error;
    }
  },

  getMatchById: async (matchId) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.MATCHES}/${matchId}`);
    } catch (error) {
      throw error;
    }
  },

  createMatch: async (matchData) => {
    try {
      return await apiClient.post(API_ENDPOINTS.MATCHES, matchData);
    } catch (error) {
      throw error;
    }
  },

  updateMatch: async (matchId, matchData) => {
    try {
      // backend uses PUT /matches/:id/results for match result updates (per README)
      return await apiClient.put(API_ENDPOINTS.MATCH_RESULTS.replace(':id', matchId), matchData);
    } catch (error) {
      throw error;
    }
  },

  deleteMatch: async (matchId) => {
    try {
      return await apiClient.delete(`${API_ENDPOINTS.MATCHES}/${matchId}`);
    } catch (error) {
      throw error;
    }
  },

  updateMatchResult: async (matchId, resultData) => {
    try {
      // use canonical match results endpoint
      return await apiClient.put(API_ENDPOINTS.MATCH_RESULTS.replace(':id', matchId), resultData);
    } catch (error) {
      throw error;
    }
  },

  getMatchStats: async (matchId) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.MATCHES}/${matchId}/stats`);
    } catch (error) {
      throw error;
    }
  },

  getLiveMatches: async (params = {}) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.MATCHES}/live`, { params });
    } catch (error) {
      throw error;
    }
  },

  getUpcomingMatches: async (params = {}) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.MATCHES}/upcoming`, { params });
    } catch (error) {
      throw error;
    }
  },

  getCompletedMatches: async (params = {}) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.MATCHES}/completed`, { params });
    } catch (error) {
      throw error;
    }
  },

  startMatch: async (matchId) => {
    try {
      return await apiClient.post(`${API_ENDPOINTS.MATCHES}/${matchId}/start`);
    } catch (error) {
      throw error;
    }
  },

  endMatch: async (matchId) => {
    try {
      return await apiClient.post(`${API_ENDPOINTS.MATCHES}/${matchId}/end`);
    } catch (error) {
      throw error;
    }
  },

  postponeMatch: async (matchId, newDate, reason = '') => {
    try {
      return await apiClient.post(`${API_ENDPOINTS.MATCHES}/${matchId}/postpone`, {
        newDate,
        reason,
      });
    } catch (error) {
      throw error;
    }
  },

  reportComplaint: async (matchId, complaintData) => {
    try {
      return await apiClient.post(`${API_ENDPOINTS.MATCHES}/${matchId}/complaints`, complaintData);
    } catch (error) {
      throw error;
    }
  },

  getMatchComplaints: async (matchId) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.MATCHES}/${matchId}/complaints`);
    } catch (error) {
      throw error;
    }
  },

  resolveComplaint: async (complaintId, resolution) => {
    try {
      return await apiClient.post(`${API_ENDPOINTS.COMPLAINTS}/${complaintId}/resolve`, {
        resolution,
      });
    } catch (error) {
      throw error;
    }
  },

  getMatchHighlights: async (matchId) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.MATCHES}/${matchId}/highlights`);
    } catch (error) {
      throw error;
    }
  },

  addMatchHighlight: async (matchId, highlightData) => {
    try {
      return await apiClient.post(`${API_ENDPOINTS.MATCHES}/${matchId}/highlights`, highlightData);
    } catch (error) {
      throw error;
    }
  },

  getMatchesByTeam: async (teamId, params = {}) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.MATCHES}/team/${teamId}`, { params });
    } catch (error) {
      throw error;
    }
  },

  getMatchesByTournament: async (tournamentId, params = {}) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.MATCHES}/tournament/${tournamentId}`, { params });
    } catch (error) {
      throw error;
    }
  },
};

export default matchService;
