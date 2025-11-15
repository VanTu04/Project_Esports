import { apiClient } from './api';

const blockchainService = {
  /**
   * Get all blockchain transactions
   */
  getAllTransactions: async (params = {}) => {
    try {
      const response = await apiClient.get('/blockchain/transactions', { params });
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
      const response = await apiClient.post('/blockchain/store-match-result', { matchId });
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
      const response = await apiClient.post('/blockchain/verify-match-result', {
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
      const response = await apiClient.post(`/tournaments/${tournamentId}/distribute-rewards`, {
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
      const response = await apiClient.get('/blockchain/rewards', { params });
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
      const response = await apiClient.get('/wallet/transactions', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Team-scoped: backend will resolve team from auth context
  getTeamWalletTransactions: async (params = {}) => {
    try {
      const response = await apiClient.get('/wallet/transactions', { params });
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
      const response = await apiClient.get('/wallet/balance');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Team-scoped: backend will resolve team from auth context
  getTeamWalletBalance: async () => {
    try {
      const response = await apiClient.get('/wallet/balance');
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
      const response = await apiClient.post('/blockchain/verify-wallet', {
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
      const response = await apiClient.get('/blockchain/stats');
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
      const response = await apiClient.get('/blockchain/transactions/pending');
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
      const response = await apiClient.get('/blockchain/transactions/failed', { params });
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
      const response = await apiClient.get('/blockchain/gas-price');
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
      const response = await apiClient.post('/blockchain/store-tournament', { tournamentId });
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
      const response = await apiClient.get(`/blockchain/tournaments/${tournamentId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default blockchainService;