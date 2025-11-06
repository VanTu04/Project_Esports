import { apiClient } from './api';

const rewardService = {
  /**
   * Get all rewards
   */
  getAllRewards: async (params = {}) => {
    try {
      const response = await apiClient.get('/rewards', { params });
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
      const response = await apiClient.post('/rewards', rewardData);
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
      const response = await apiClient.put(`/rewards/${rewardId}`, rewardData);
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
      const response = await apiClient.delete(`/rewards/${rewardId}`);
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
      const response = await apiClient.get(`/rewards/tournament/${tournamentId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Configure tournament rewards (Admin only)
   */
  configureTournamentRewards: async (tournamentId, rewardsConfig) => {
    try {
      const response = await apiClient.post(`/rewards/tournament/${tournamentId}/configure`, 
        rewardsConfig
      );
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
      const response = await apiClient.get(`/rewards/tournament/${tournamentId}/distribution`);
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
      const response = await apiClient.post(`/rewards/tournament/${tournamentId}/approve`);
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
      const response = await apiClient.post(`/rewards/tournament/${tournamentId}/execute`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get team rewards
   */
  getTeamRewards: async (teamId, params = {}) => {
    try {
      const response = await apiClient.get(`/rewards/team/${teamId}`, { params });
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
      const response = await apiClient.get(`/rewards/player/${playerId}`, { params });
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
      const response = await apiClient.post(`/rewards/${rewardId}/claim`);
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
      const response = await apiClient.get('/rewards/claims', { params });
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
      const response = await apiClient.get('/rewards/pending', { params });
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
      const response = await apiClient.get('/rewards/distributed', { params });
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
      const response = await apiClient.post('/rewards/calculate', {
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
      const response = await apiClient.get('/rewards/stats', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default rewardService;