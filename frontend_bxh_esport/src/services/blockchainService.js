import { apiClient } from './api';
import { API_ENDPOINTS } from '../utils/constants';

const blockchainService = {
  /**
   * Get all blockchain transactions
   */
  getAllTransactions: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BLOCKCHAIN_TRANSACTIONS || '/blockchain/transactions', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get transaction by hash
   */
  getTransactionByHash: async (txHash) => {
    try {
      const response = await apiClient.get(`/blockchain/transactions/${txHash}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Store match result on blockchain
   */
  storeMatchResult: async (matchId) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.BLOCKCHAIN_STORE_MATCH_RESULT, { matchId });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify match result from blockchain
   */
  verifyMatchResult: async (matchId, txHash) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.BLOCKCHAIN_VERIFY_MATCH_RESULT, {
        matchId,
        txHash,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Distribute rewards
   */
  distributeRewards: async (tournamentId, distributionData) => {
    try {
      // Backend exposes tournament-level distribute endpoint: POST /api/tournaments/:tournament_id/distribute-rewards
      const endpoint = API_ENDPOINTS.TOURNAMENTS + `/${tournamentId}/distribute-rewards`;
      const response = await apiClient.post(endpoint, {
        ...distributionData,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get reward distribution history
   */
  getRewardHistory: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BLOCKCHAIN_REWARDS, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get wallet transactions
   */
  // Authenticated: get current user's wallet transactions
  getMyWalletTransactions: async (params = {}) => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.WALLET}/transactions`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Team-scoped: backend will resolve team from auth context
  getTeamWalletTransactions: async (params = {}) => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.WALLET}/transactions`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get wallet balance
   */
  // Authenticated: get current user's wallet balance
  getMyWalletBalance: async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.WALLET}/balance`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Team-scoped: backend will resolve team from auth context
  getTeamWalletBalance: async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.WALLET}/balance`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify wallet ownership
   */
  verifyWalletOwnership: async (walletAddress, signature, message) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.BLOCKCHAIN_VERIFY_WALLET, {
        walletAddress,
        signature,
        message,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get blockchain statistics
   */
  getBlockchainStats: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BLOCKCHAIN_STATS);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get pending transactions
   */
  getPendingTransactions: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BLOCKCHAIN_TX_PENDING);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get failed transactions
   */
  getFailedTransactions: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BLOCKCHAIN_TX_FAILED, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Retry failed transaction
   */
  retryTransaction: async (transactionId) => {
    try {
      const response = await apiClient.post(`/blockchain/transactions/${transactionId}/retry`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get gas price estimation
   */
  getGasPriceEstimation: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BLOCKCHAIN_GAS_PRICE);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Store tournament data on blockchain
   */
  storeTournamentData: async (tournamentId) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.BLOCKCHAIN_STORE_TOURNAMENT, { tournamentId });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get tournament data from blockchain
   */
  getTournamentDataFromBlockchain: async (tournamentId) => {
    try {
      const endpoint = API_ENDPOINTS.BLOCKCHAIN_TOURNAMENTS.replace(':id', tournamentId);
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default blockchainService;