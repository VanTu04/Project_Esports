import { apiClient } from './api';
import { API_ENDPOINTS } from '../utils/constants';

const rewardService = {
  /**
   * Get tournament rewards (Backend: GET /api/tournaments/:id/rewards)
   */
  getTournamentRewards: async (tournamentId) => {
    try {
      const endpoint = API_ENDPOINTS.TOURNAMENT_REWARDS.replace(':id', tournamentId);
      const response = await apiClient.get(endpoint);
      return response?.data ?? response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get reward distribution list
   */
  getRewardDistributionList: async (tournamentId) => {
    try {
      const endpoint = `/tournaments/${tournamentId}/distributions`;
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Execute reward distribution (Admin only)
   * Backend: POST /api/distribute-rewards
   */
  executeRewardDistribution: async (tournamentId) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.DISTRIBUTE_REWARDS, { 
        tournament_id: Number(tournamentId) 
      });
      return response?.data ?? response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create tournament rewards
   * Backend: POST /api/tournaments/:id/rewards
   */
  createTournamentRewards: async (tournamentId, rewards) => {
    try {
      const endpoint = API_ENDPOINTS.TOURNAMENT_REWARDS.replace(':id', tournamentId);
      const response = await apiClient.post(endpoint, { rewards });
      return response?.data ?? response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get pending rewards (mock - backend doesn't have this yet)
   */
  getPendingRewards: async (params = {}) => {
    try {
      // TODO: Backend needs to implement this endpoint
      // For now, return empty array
      return { data: [] };
    } catch (error) {
      throw error;
    }
  },
};

export default rewardService;