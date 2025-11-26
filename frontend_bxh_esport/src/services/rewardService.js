import { apiClient } from './api';
import { API_ENDPOINTS } from '../utils/constants';

const rewardService = {
  /**
   * Get all rewards
   */
  getAllRewards: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.REWARDS, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get reward by ID
   */
  getRewardById: async (rewardId) => {
    try {
      const response = await apiClient.get(`/rewards/${rewardId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create reward configuration (Admin only)
   */
  createReward: async (rewardData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.REWARDS, rewardData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update reward configuration (Admin only)
   */
  updateReward: async (rewardId, rewardData) => {
    try {
      const response = await apiClient.put(`${API_ENDPOINTS.REWARDS}/${rewardId}`, rewardData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete reward (Admin only)
   */
  deleteReward: async (rewardId) => {
    try {
      const response = await apiClient.delete(`${API_ENDPOINTS.REWARDS}/${rewardId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get tournament rewards
   */
  getTournamentRewards: async (tournamentId) => {
    try {
      // Backend route: GET /api/tournaments/:tournament_id/rewards
      const endpoint = API_ENDPOINTS.TOURNAMENT_REWARDS.replace(':id', tournamentId);
      const response = await apiClient.get(endpoint);
      return response?.data ?? response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Configure tournament rewards (Admin only)
   */
  configureTournamentRewards: async (tournamentId, rewardsConfig) => {
    try {
      const endpoint = `${API_ENDPOINTS.REWARDS}/tournament/${tournamentId}/configure`;
      const response = await apiClient.post(endpoint, rewardsConfig);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get reward distribution list
   */
  getRewardDistributionList: async (tournamentId) => {
    try {
      const endpoint = `${API_ENDPOINTS.REWARDS}/tournament/${tournamentId}/distribution`;
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Approve reward distribution (Admin only)
   */
  approveRewardDistribution: async (tournamentId) => {
    try {
      const endpoint = `${API_ENDPOINTS.REWARDS}/tournament/${tournamentId}/approve`;
      const response = await apiClient.post(endpoint);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Execute reward distribution (Admin only)
   */
  executeRewardDistribution: async (tournamentId) => {
    try {
      // Call admin controller route that runs the smart-contract distribution flow
      // Backend mounts this at POST /api/distribute-rewards
      const response = await apiClient.post('/distribute-rewards', { tournament_id: Number(tournamentId) });
      return response?.data ?? response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get team rewards
   */
  getTeamRewards: async (teamId, params = {}) => {
    try {
      const endpoint = `${API_ENDPOINTS.REWARDS}/team/${teamId}`;
      const response = await apiClient.get(endpoint, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get player rewards
   */
  getPlayerRewards: async (playerId, params = {}) => {
    try {
      const endpoint = `${API_ENDPOINTS.REWARDS}/player/${playerId}`;
      const response = await apiClient.get(endpoint, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Claim reward
   */
  claimReward: async (rewardId) => {
    try {
      const response = await apiClient.post(`${API_ENDPOINTS.REWARDS}/${rewardId}/claim`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get reward claim history
   */
  getClaimHistory: async (params = {}) => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.REWARDS}/claims`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get pending rewards
   */
  getPendingRewards: async (params = {}) => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.REWARDS}/pending`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get distributed rewards
   */
  getDistributedRewards: async (params = {}) => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.REWARDS}/distributed`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Calculate reward amount
   */
  calculateRewardAmount: async (tournamentId, position) => {
    try {
      const response = await apiClient.post(`${API_ENDPOINTS.REWARDS}/calculate`, {
        tournamentId,
        position,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get reward statistics
   */
  getRewardStats: async (params = {}) => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.REWARDS}/stats`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default rewardService;