import { apiClient } from './api';
import { USE_MOCK_API } from '../config';
import { mockMatchService } from '../mock/mockServices';

const matchService = {
  getAllMatches: async (params = {}) => {
    if (USE_MOCK_API) return await mockMatchService.getAllMatches(params);
    try {
      const response = await apiClient.get('/matches', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  getMatchById: async (matchId) => {
    if (USE_MOCK_API) return await mockMatchService.getMatchById(matchId);
    try {
      const response = await apiClient.get(`/matches/${matchId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  createMatch: async (matchData) => {
    if (USE_MOCK_API) return await mockMatchService.createMatch(matchData);
    try {
      const response = await apiClient.post('/matches', matchData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  updateMatch: async (matchId, matchData) => {
    if (USE_MOCK_API) return await mockMatchService.updateMatch(matchId, matchData);
    try {
      const response = await apiClient.put(`/matches/${matchId}`, matchData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  deleteMatch: async (matchId) => {
    if (USE_MOCK_API) return await mockMatchService.deleteMatch(matchId);
    try {
      const response = await apiClient.delete(`/matches/${matchId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  updateMatchResult: async (matchId, resultData) => {
    if (USE_MOCK_API) return await mockMatchService.updateMatchResult(matchId, resultData);
    try {
      const response = await apiClient.post(`/matches/${matchId}/result`, resultData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getMatchStats: async (matchId) => {
    if (USE_MOCK_API) return await mockMatchService.getMatchStats(matchId);
    try {
      const response = await apiClient.get(`/matches/${matchId}/stats`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getLiveMatches: async () => {
    if (USE_MOCK_API) return await mockMatchService.getLiveMatches();
    try {
      const response = await apiClient.get('/matches/live');
      return response;
    } catch (error) {
      throw error;
    }
  },

  getUpcomingMatches: async (params = {}) => {
    if (USE_MOCK_API) return await mockMatchService.getUpcomingMatches(params);
    try {
      const response = await apiClient.get('/matches/upcoming', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  getCompletedMatches: async (params = {}) => {
    if (USE_MOCK_API) return await mockMatchService.getCompletedMatches(params);
    try {
      const response = await apiClient.get('/matches/completed', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  startMatch: async (matchId) => {
    if (USE_MOCK_API) return await mockMatchService.startMatch(matchId);
    try {
      const response = await apiClient.post(`/matches/${matchId}/start`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  endMatch: async (matchId) => {
    if (USE_MOCK_API) return await mockMatchService.endMatch(matchId);
    try {
      const response = await apiClient.post(`/matches/${matchId}/end`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  postponeMatch: async (matchId, newDate, reason = '') => {
    if (USE_MOCK_API) return await mockMatchService.postponeMatch(matchId, newDate, reason);
    try {
      const response = await apiClient.post(`/matches/${matchId}/postpone`, {
        newDate,
        reason,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  reportComplaint: async (matchId, complaintData) => {
    if (USE_MOCK_API) return await mockMatchService.reportComplaint(matchId, complaintData);
    try {
      const response = await apiClient.post(`/matches/${matchId}/complaints`, complaintData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getMatchComplaints: async (matchId) => {
    if (USE_MOCK_API) return await mockMatchService.getMatchComplaints(matchId);
    try {
      const response = await apiClient.get(`/matches/${matchId}/complaints`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  resolveComplaint: async (complaintId, resolution) => {
    if (USE_MOCK_API) return await mockMatchService.resolveComplaint(complaintId, resolution);
    try {
      const response = await apiClient.post(`/matches/complaints/${complaintId}/resolve`, {
        resolution,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  getMatchHighlights: async (matchId) => {
    if (USE_MOCK_API) return await mockMatchService.getMatchHighlights(matchId);
    try {
      const response = await apiClient.get(`/matches/${matchId}/highlights`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  addMatchHighlight: async (matchId, highlightData) => {
    if (USE_MOCK_API) return await mockMatchService.addMatchHighlight(matchId, highlightData);
    try {
      const response = await apiClient.post(`/matches/${matchId}/highlights`, highlightData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getMatchesByTeam: async (teamId, params = {}) => {
    if (USE_MOCK_API) return await mockMatchService.getMatchesByTeam(teamId, params);
    try {
      const response = await apiClient.get(`/matches/team/${teamId}`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  getMatchesByTournament: async (tournamentId, params = {}) => {
    if (USE_MOCK_API) return await mockMatchService.getMatchesByTournament(tournamentId, params);
    try {
      const response = await apiClient.get(`/matches/tournament/${tournamentId}`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default matchService;
