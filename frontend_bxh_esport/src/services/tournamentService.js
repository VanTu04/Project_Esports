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
      // Gọi API từ match routes thay vì tournament routes
      const queryParams = {
        tournament_id: tournamentId,
        round_number: params.round_number || 1,
        ...params
      };
      return await apiClient.get(`${API_ENDPOINTS.MATCHES}/matches`, { params: queryParams });
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

  // Finish tournament
  finishTournament: async (tournamentId) => {
    try {
      return await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/finish`);
    } catch (error) {
      throw error;
    }
  },

  // Get tournament rounds
  getTournamentRounds: async (tournamentId) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/rounds`);
    } catch (error) {
      throw error;
    }
  },

  // Get tournament leaderboard
  getTournamentLeaderboard: async (tournamentId) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/leaderboard`);
    } catch (error) {
      throw error;
    }
  },

  startNextRound: async (tournamentId) => {
    try {
      // Gọi API tạo vòng mới (Swiss)
      // Backend router defines the route as POST /api/tournaments/:tournament_id/next-round
      return await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/next-round`);
    } catch (error) {
      throw error;
    }
  },
  // Record leaderboard on-chain (admin action)
  // POST /api/tournaments/record-ranking/:tournamentId
  recordRanking: async (tournamentId) => {
    try {
      return await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/record-ranking/${tournamentId}`);
    } catch (error) {
      throw error;
    }
  },

  // Get final leaderboard (used after recording)
  // Backend exposes POST /api/tournaments/bxh/:tournamentId
  getFinalLeaderboard: async (tournamentId) => {
    try {
      return await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/bxh/${tournamentId}`);
    } catch (error) {
      throw error;
    }
  },

  // Get distribution history for a tournament
  getDistributions: async (tournamentId) => {
    try {
      return await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/distributions`);
    } catch (error) {
      throw error;
    }
  },
  // === MATCH APIs ===
  
  // Get matches by tournament and optional round
  // GET /api/matches/matches?tournament_id=1&round_number=1
  getMatches: async (params = {}) => {
    try {
      // Backend yêu cầu round_number, nếu không có thì dùng mặc định là 1
      const queryParams = {
        ...params,
        round_number: params.round_number || 1
      };
  return await apiClient.get(`${API_ENDPOINTS.MATCHES}/matches`, { params: queryParams });
    } catch (error) {
      throw error;
    }
  },

  // Report match result (update score and winner)
  // POST /api/matches/match/:id/report
  reportMatchResult: async (matchId, data) => {
    try {
  return await apiClient.post(`${API_ENDPOINTS.MATCHES}/match/${matchId}/report`, data);
    } catch (error) {
      throw error;
    }
  },

  // Update match schedule time
  // PUT /api/matches/match/:id/schedule
  updateMatchSchedule: async (matchId, data) => {
    try {
  return await apiClient.put(`${API_ENDPOINTS.MATCHES}/match/${matchId}/schedule`, data);
    } catch (error) {
      throw error;
    }
  },

  // Get match score from blockchain
  // GET /api/matches/match/:matchId/score
  getMatchScore: async (matchId) => {
    try {
  return await apiClient.get(`${API_ENDPOINTS.MATCHES}/match/${matchId}/score`);
    } catch (error) {
      throw error;
    }
  },

  // Get all matches from blockchain by tournament
  // GET /api/matches/tournament/:tournamentId/matches
  getTournamentMatchesFromBlockchain: async (tournamentId) => {
    try {
  return await apiClient.get(`${API_ENDPOINTS.MATCHES}/tournament/${tournamentId}/matches`);
    } catch (error) {
      throw error;
    }
  },
};

export default tournamentService;
