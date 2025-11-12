import { apiClient } from './api';
import { API_ENDPOINTS } from '../utils/constants';

const build = (template, id) => template.replace(':id', id);

const tournamentService = {
  getAllTournaments: async (params = {}) => {
    try {
      return await apiClient.get(API_ENDPOINTS.TOURNAMENTS, { params });
    } catch (error) {
      throw error;
    }
  },

  getTournamentById: async (tournamentId) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}`);
    } catch (error) {
      throw error;
    }
  },

  getTournamentTeams: async (tournamentId) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/teams`);
    } catch (error) {
      throw error;
    }
  },

  getTournamentMatches: async (tournamentId, params = {}) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/matches`, { params });
    } catch (error) {
      throw error;
    }
  },

  createTournament: async (newTournament) => {
    try {
      return await apiClient.post(API_ENDPOINTS.TOURNAMENTS, newTournament);
    } catch (error) {
      throw error;
    }
  },

  updateTournament: async (id, updatedData) => {
    try {
      return await apiClient.put(`${API_ENDPOINTS.TOURNAMENTS}/${id}`, updatedData);
    } catch (error) {
      throw error;
    }
  },

  deleteTournament: async (id) => {
    try {
      return await apiClient.delete(`${API_ENDPOINTS.TOURNAMENTS}/${id}`);
    } catch (error) {
      throw error;
    }
  },
};

export default tournamentService;
