import { apiClient } from './api';
import { API_ENDPOINTS } from '../utils/constants';

const build = (template, id) => template.replace(':id', id);

const tournamentService = {
  getAllTournaments: async (params = {}) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.TOURNAMENTS, { params });
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Admin variant: calls /tournaments/admin which returns all (including isReady=false)
  getAllTournamentsAdmin: async (params = {}) => {
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS}/admin`, { params });
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Get tournament statistics
  getTournamentStatistics: async () => {
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS}/statistics/overview`);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  getTournamentById: async (tournamentId) => {
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}`);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  getTournamentTeams: async (tournamentId) => {
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/teams`);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  getTournamentMatches: async (tournamentId, params = {}) => {
    try {
      // Backend exposes matches via the tournaments router at POST /tournaments/rounds/matches
      // The controller expects body fields named `tournaments` and `rounds` (legacy names),
      // so include both `tournament_id`/`round_number` and the legacy keys to be safe.
      // IMPORTANT: do NOT default `round_number` to 1 here — if caller omits round_number
      // we should request matches for all rounds (backend will treat missing round_number
      // as "all rounds"), otherwise callers that want all rounds will only receive round 1.
      const body = {
        tournament_id: tournamentId,
        tournaments: tournamentId
      };
      if (params && params.round_number !== undefined && params.round_number !== null) {
        body.round_number = params.round_number;
        body.rounds = params.round_number;
      }

      const res = await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/rounds/matches`, body);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  createTournament: async (newTournament) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.TOURNAMENTS, newTournament);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  updateTournament: async (id, updatedData) => {
    try {
      // If caller passed FormData (contains image), send multipart headers
      if (updatedData instanceof FormData) {
        const res = await apiClient.put(`${API_ENDPOINTS.TOURNAMENTS}/${id}`, updatedData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res?.data ?? res;
      }
      const res = await apiClient.put(`${API_ENDPOINTS.TOURNAMENTS}/${id}`, updatedData);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  deleteTournament: async (id) => {
    try {
      const res = await apiClient.delete(`${API_ENDPOINTS.TOURNAMENTS}/${id}`);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Register team to tournament (Admin adds team directly)
  registerTeam: async (tournamentId, data) => {
    try {
      const res = await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/register`, data);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Get participants from tournament detail (filter by status if needed)
  getParticipants: async (tournamentId, status = null) => {
    try {
      // Backend trả participants qua GET /tournaments/:id trong trường participants
      const response = await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}`);

      // Axios response objects have the server payload under `response.data`.
      // Normalize common shapes: { code, data: { participants } } or { participants: [] } or data.array
      const payload = response?.data ?? response;

      // Attempt to find participants array in several common locations
      let participants = [];
      if (Array.isArray(payload?.data?.participants)) {
        participants = payload.data.participants;
      } else if (Array.isArray(payload?.participants)) {
        participants = payload.participants;
      } else if (Array.isArray(payload?.data)) {
        // Sometimes API returns { data: [ ...tournaments ] }
        participants = payload.data;
      } else if (Array.isArray(payload)) {
        participants = payload;
      }

      // If a status filter was requested, filter case-insensitively
      if (status && Array.isArray(participants)) {
        const upperStatus = String(status).toUpperCase();
        participants = participants.filter(p => String(p.status || '').toUpperCase() === upperStatus);
      }

      return { code: 0, data: participants };
    } catch (error) {
      console.error('getParticipants error:', error);
      throw error;
    }
  },
  
  // Get pending registrations for admin review
  getPendingRegistrations: async (tournamentId) => {
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/pending-registrations`);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Approve a participant (participantId is used in the route as in backend examples)
  approveParticipant: async (participantId) => {
    try {
      const res = await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/${participantId}/approve`);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Reject a participant with optional reason
  rejectParticipant: async (participantId, reason = null) => {
    try {
      const res = await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/${participantId}/reject`, { reason });
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Review join request (approve/reject)
  // Backend route: POST /tournaments/review-request/:participant_id
  reviewJoinRequest: async (participantId, action) => {
    try {
      const res = await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/review-request/${participantId}`, { action });
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Start tournament
  startTournament: async (tournamentId) => {
    try {
      const res = await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/start`);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Admin: mark tournament as ready (open registration)
  isReadyTrue: async (tournamentId) => {
    try {
      const res = await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/isReady`, { id: tournamentId });
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Team requests to join tournament
  requestJoinTournament: async (tournamentId) => {
    try {
      const res = await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/register`);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  confirmBlockchainRegistration: async (participantId, tx_hash) => {
    try {
      const res = await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/${participantId}/confirm`, { tx_hash });
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  getMyRegistrationStatus: async (tournamentId) => {
    const res = await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/my-registration`);
    return res?.data ?? res;
  },

  // Finish tournament
  finishTournament: async (tournamentId) => {
    try {
      const res = await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/finish`);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Get tournament rounds
  getTournamentRounds: async (tournamentId) => {
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/rounds`);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Get tournament leaderboard
  getTournamentLeaderboard: async (tournamentId) => {
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/leaderboard`);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  startNextRound: async (tournamentId) => {
    try {
      // Gọi API tạo vòng mới (Swiss)
      // Backend router defines the route as POST /api/tournaments/:tournament_id/next-round
      const res = await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/next-round`);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },
  // Record leaderboard on-chain (admin action)
  // POST /api/tournaments/record-ranking/:tournamentId
  recordRanking: async (tournamentId) => {
    try {
      const res = await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/record-ranking/${tournamentId}`);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Get final leaderboard (used after recording)
  // Backend exposes POST /api/tournaments/bxh/:tournamentId
  getFinalLeaderboard: async (tournamentId) => {
    try {
      const res = await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/bxh/${tournamentId}`);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Get distribution history for a tournament
  getDistributions: async (tournamentId) => {
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS}/${tournamentId}/distributions`);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },
  // === MATCH APIs ===
  
  // Get matches by tournament and optional round
  // GET /api/matches/matches?tournament_id=1&round_number=1
  getMatches: async (params = {}) => {
    try {
      // Do not default round_number to 1 here. If caller omits round_number,
      // pass only the provided params so backend can decide behavior (or return all rounds).
      const queryParams = { ...params };
      if (params && params.round_number !== undefined && params.round_number !== null) {
        queryParams.round_number = params.round_number;
      }
      const res = await apiClient.get(`${API_ENDPOINTS.MATCHES}/matches`, { params: queryParams });
  return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Report match result (update score and winner)
  // POST /api/matches/match/:id/report
  reportMatchResult: async (matchId, data) => {
    try {
  const res = await apiClient.post(`${API_ENDPOINTS.MATCHES}/match/${matchId}/report`, data);
  return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Update match schedule time
  // PUT /api/matches/match/:id/schedule
  updateMatchSchedule: async (matchId, data) => {
    try {
  const res = await apiClient.put(`${API_ENDPOINTS.MATCHES}/match/${matchId}/schedule`, data);
  return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Update match by numeric scores (calls tournaments router)
  // POST /api/tournaments/matches/:match_id/update-score
  updateMatchScore: async (matchId, scoreA, scoreB) => {
    try {
      const res = await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/matches/${matchId}/update-score`, {
        score_team_a: Number(scoreA),
        score_team_b: Number(scoreB)
      });
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Get match score from blockchain
  // GET /api/matches/match/:matchId/score
  getMatchScore: async (matchId) => {
    try {
  const res = await apiClient.get(`${API_ENDPOINTS.MATCHES}/match/${matchId}/score`);
  return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  // Get all matches from blockchain by tournament
  // GET /api/matches/tournament/:tournamentId/matches
  getTournamentMatchesFromBlockchain: async (tournamentId) => {
    try {
  const res = await apiClient.get(`${API_ENDPOINTS.MATCHES}/tournament/${tournamentId}/matches`);
  return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },
};

export default tournamentService;
