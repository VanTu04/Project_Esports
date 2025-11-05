import { apiClient } from './api';
import { USE_MOCK_API } from '../config';
import { mockTournamentService } from '../mock/mockServices';

const tournamentService = {
  getAllTournaments: async (params = {}) => {
    if (USE_MOCK_API) return await mockTournamentService.getAllTournaments(params);
    try {
      const response = await apiClient.get('/tournaments', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  getTournamentById: async (tournamentId) => {
    if (USE_MOCK_API) return await mockTournamentService.getTournamentById(tournamentId);
    try {
      const response = await apiClient.get(`/tournaments/${tournamentId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getTournamentTeams: async (tournamentId) => {
    if (USE_MOCK_API) return await mockTournamentService.getTournamentTeams(tournamentId);
    try {
      const response = await apiClient.get(`/tournaments/${tournamentId}/teams`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getTournamentMatches: async (tournamentId, params = {}) => {
    if (USE_MOCK_API) return await mockTournamentService.getTournamentMatches(tournamentId, params);
    try {
      const response = await apiClient.get(`/tournaments/${tournamentId}/matches`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  createTournament: async (newTournament) => {
    if (USE_MOCK_API) return await mockTournamentService.createTournament(newTournament);
    try {
      const response = await apiClient.post('/tournaments', newTournament);
      return response;
    } catch (error) {
      throw error;
    }
  },

  updateTournament: async (id, updatedData) => {
    if (USE_MOCK_API) return await mockTournamentService.updateTournament(id, updatedData);
    try {
      const response = await apiClient.put(`/tournaments/${id}`, updatedData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  deleteTournament: async (id) => {
    if (USE_MOCK_API) return await mockTournamentService.deleteTournament(id);
    try {
      const response = await apiClient.delete(`/tournaments/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default tournamentService;
