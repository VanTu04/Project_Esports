import { apiClient } from './api';
import { API_ENDPOINTS } from '../utils/constants';

const playerService = {
  /**
   * Get all players
   */
  getAllPlayers: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PLAYERS, { params });
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
      const response = await apiClient.get(`${API_ENDPOINTS.PLAYERS}/${playerId}`);
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
      const response = await apiClient.put(`${API_ENDPOINTS.PLAYERS}/${playerId}`, playerData);
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
      const endpoint = API_ENDPOINTS.PLAYER_STATS.replace(':id', playerId);
      const response = await apiClient.get(endpoint);
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
      const response = await apiClient.get(`${API_ENDPOINTS.PLAYERS}/${playerId}/matches`, { params });
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
      const response = await apiClient.get(`${API_ENDPOINTS.PLAYERS}/${playerId}/tournaments`, { params });
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
      const response = await apiClient.get(`${API_ENDPOINTS.PLAYERS}/${playerId}/achievements`);
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
      const response = await apiClient.get(`${API_ENDPOINTS.PLAYERS}/${playerId}/invitations`);
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
      const response = await apiClient.post(`${API_ENDPOINTS.PLAYERS}/invitations/${invitationId}/accept`);
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
      const response = await apiClient.post(`${API_ENDPOINTS.PLAYERS}/invitations/${invitationId}/reject`);
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
      const response = await apiClient.get(`${API_ENDPOINTS.PLAYERS}/rankings`, { params });
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
      const response = await apiClient.post(`${API_ENDPOINTS.PLAYERS}/${playerId}/wallet`, {
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
      const response = await apiClient.get(`${API_ENDPOINTS.PLAYERS}/${playerId}/transactions`, { params });
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
      const response = await apiClient.patch(`${API_ENDPOINTS.PLAYERS}/${playerId}/role`, { role });
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
      
      const response = await apiClient.post(`${API_ENDPOINTS.PLAYERS}/${playerId}/avatar`, formData, {
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
      const response = await apiClient.get(`${API_ENDPOINTS.PLAYERS}/top`, { params });
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
      const response = await apiClient.get(`${API_ENDPOINTS.PLAYERS}/search`, {
        params: { query, ...params },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default playerService;