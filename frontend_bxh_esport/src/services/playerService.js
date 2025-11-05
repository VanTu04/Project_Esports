import { apiClient } from './api';

const playerService = {
  /**
   * Get all players
   */
  getAllPlayers: async (params = {}) => {
    try {
      const response = await apiClient.get('/players', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get player by ID
   */
  getPlayerById: async (playerId) => {
    try {
      const response = await apiClient.get(`/players/${playerId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update player profile
   */
  updatePlayerProfile: async (playerId, playerData) => {
    try {
      const response = await apiClient.put(`/players/${playerId}`, playerData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get player statistics
   */
  getPlayerStats: async (playerId) => {
    try {
      const response = await apiClient.get(`/players/${playerId}/stats`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get player match history
   */
  getPlayerMatches: async (playerId, params = {}) => {
    try {
      const response = await apiClient.get(`/players/${playerId}/matches`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get player tournaments
   */
  getPlayerTournaments: async (playerId, params = {}) => {
    try {
      const response = await apiClient.get(`/players/${playerId}/tournaments`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get player achievements
   */
  getPlayerAchievements: async (playerId) => {
    try {
      const response = await apiClient.get(`/players/${playerId}/achievements`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get player invitations
   */
  getPlayerInvitations: async (playerId) => {
    try {
      const response = await apiClient.get(`/players/${playerId}/invitations`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Accept team invitation
   */
  acceptInvitation: async (invitationId) => {
    try {
      const response = await apiClient.post(`/players/invitations/${invitationId}/accept`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Reject team invitation
   */
  rejectInvitation: async (invitationId) => {
    try {
      const response = await apiClient.post(`/players/invitations/${invitationId}/reject`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get player rankings
   */
  getPlayerRankings: async (params = {}) => {
    try {
      const response = await apiClient.get('/players/rankings', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Link player wallet
   */
  linkWallet: async (playerId, walletAddress, signature) => {
    try {
      const response = await apiClient.post(`/players/${playerId}/wallet`, {
        walletAddress,
        signature,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get player blockchain transactions
   */
  getPlayerTransactions: async (playerId, params = {}) => {
    try {
      const response = await apiClient.get(`/players/${playerId}/transactions`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update player role in game
   */
  updatePlayerRole: async (playerId, role) => {
    try {
      const response = await apiClient.patch(`/players/${playerId}/role`, { role });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Upload player avatar
   */
  uploadAvatar: async (playerId, file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await apiClient.post(`/players/${playerId}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get top players
   */
  getTopPlayers: async (params = {}) => {
    try {
      const response = await apiClient.get('/players/top', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Search players
   */
  searchPlayers: async (query, params = {}) => {
    try {
      const response = await apiClient.get('/players/search', {
        params: { query, ...params },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default playerService;