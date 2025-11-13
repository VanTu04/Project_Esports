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

  // Register team to tournament (Admin adds team directly)
  registerTeam: async (tournamentId, data) => {
    try {
      return await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/register`, data);
    } catch (error) {
      throw error;
    }
  },

  // Get participants from tournament detail (filter by status if needed)
  getParticipants: async (tournamentId, status = null) => {
    try {
      // Backend trả participants qua GET /tournaments/:id trong trường participants
      const response = await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}`);
      
      console.log('getParticipants raw response:', response);
      
      if (response?.code === 0 && response?.data?.participants) {
        let participants = response.data.participants;
        
        console.log('All participants before filter:', participants);
        
        // Filter by status nếu được truyền
        if (status) {
          const upperStatus = status.toUpperCase();
          participants = participants.filter(p => p.status === upperStatus);
          console.log(`Filtered participants with status ${upperStatus}:`, participants);
        }
        
        return { code: 0, data: participants };
      }
      
      return { code: 1, data: [], message: 'Không lấy được danh sách participants' };
    } catch (error) {
      console.error('getParticipants error:', error);
      throw error;
    }
  },

  // Review join request (approve/reject)
  // Backend route: POST /tournaments/review-request/:participant_id
  reviewJoinRequest: async (participantId, action) => {
    try {
      return await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/review-request/${participantId}`, { action });
    } catch (error) {
      throw error;
    }
  },

  // Start tournament
  startTournament: async (tournamentId) => {
    try {
      return await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/start`);
    } catch (error) {
      throw error;
    }
  },

  // Team requests to join tournament
  requestJoinTournament: async (tournamentId) => {
    try {
      return await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/request-join`);
    } catch (error) {
      throw error;
    }
  },
};

export default tournamentService;
