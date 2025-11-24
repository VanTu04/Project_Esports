import { apiClient } from './api';
import { API_ENDPOINTS } from '../utils/constants';
import storage from '../utils/storage';

const CACHE_KEY_WALLET_TX = 'CACHED_WALLET_TRANSACTIONS';

const blockchainService = {
  /**
   * Get all blockchain transactions
   */
  getAllTransactions: async (params = {}) => {
    try {
      // Backend does not expose a global /blockchain/transactions endpoint.
      // Use wallet transactions endpoint (current user's transactions) as the closest supported API.
      const response = await apiClient.get(`${API_ENDPOINTS.WALLET}/transactions`, { params });
      return (response && response.data) ? response.data : response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get transaction by hash
   */
  getTransactionByHash: async (txHash) => {
    try {
      // Backend has no direct /blockchain/transactions/:hash route. Fall back to fetching wallet transactions and filter.
      const resp = await apiClient.get(`${API_ENDPOINTS.WALLET}/transactions`);
      const payload = resp && resp.data ? resp.data : resp;
      const transactions = payload?.data ?? payload ?? [];
      const found = (Array.isArray(transactions) ? transactions : []).find(t => t.tx_hash === txHash || t.txHash === txHash || t.tx_hash === txHash);
      return found || null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Store match result on blockchain
   */
  storeMatchResult: async (matchId) => {
    try {
      // There is no dedicated backend HTTP route for storing match result on-chain.
      // Prefer using tournament endpoints if available (e.g., recording ranking is exposed), otherwise return an informative error.
      console.warn('[blockchainService] storeMatchResult called but no backend route available');
      throw new Error('storeMatchResult is not exposed via HTTP on the backend');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify match result from blockchain
   */
  verifyMatchResult: async (matchId, txHash) => {
    try {
      // No dedicated backend HTTP route for verifying match result; this is a blockchain contract call on the server.
      console.warn('[blockchainService] verifyMatchResult called but no backend route available');
      throw new Error('verifyMatchResult is not exposed via HTTP on the backend');
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
      // However there is also a wallet-scoped endpoint POST /wallet/distribute-rewards which may be used by the UI.
      // Call the wallet endpoint for distribution as it matches backend `wallet.route.js`.
      const endpoint = `${API_ENDPOINTS.WALLET}/distribute-rewards`;
      const response = await apiClient.post(endpoint, { idTournament: tournamentId, ...distributionData });
      return (response && response.data) ? response.data : response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get reward distribution history
   */
  getRewardHistory: async (params = {}) => {
    try {
      // Backend may not expose a dedicated blockchain rewards list; fall back to tournament rewards or return empty.
      console.warn('[blockchainService] getRewardHistory: backend endpoint may not exist; returning empty list');
      return { data: [] };
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
      const payload = (response && response.data) ? response.data : response;
      // Cache successful transactions for offline/fallback usage
      try {
        const txs = payload?.data ?? payload ?? [];
        storage.setItem(CACHE_KEY_WALLET_TX, txs);
      } catch (e) {
        // ignore cache errors
      }
      return payload;
    } catch (error) {
      // Log detailed error to help debugging
      // eslint-disable-next-line no-console
      console.error('[blockchainService] getMyWalletTransactions error:', {
        message: error.message,
        status: error.response?.status,
        body: error.response?.data,
        url: error.config?.url,
      });

      // Try to parse error message from HTML or JSON returned by server
      let parsedError = error.response?.data;
      try {
        if (typeof parsedError === 'string' && parsedError.startsWith('<!DOCTYPE')) {
          // crude extraction: find first occurrence of 'ReferenceError' or message inside <pre>
          const m = parsedError.match(/<pre>([\s\S]*?)<\/pre>/i);
          if (m && m[1]) parsedError = m[1];
        }
      } catch (e) {
        // ignore parse
      }

      // Attempt to return cached transactions if available
      try {
        const cached = storage.getItem(CACHE_KEY_WALLET_TX) || [];
        if (cached && Array.isArray(cached) && cached.length > 0) {
          return { data: cached, totalItems: cached.length, totalPages: 1, currentPage: 1, _error: parsedError, _stale: true };
        }
      } catch (e) {
        // ignore cache read errors
      }

      // No cache available -> return structured fallback with error
      return { data: [], totalItems: 0, totalPages: 0, currentPage: 0, _error: parsedError || error.message };
    }
  },

  // Team-scoped: backend will resolve team from auth context
  getTeamWalletTransactions: async (params = {}) => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.WALLET}/transactions`, { params });
      return (response && response.data) ? response.data : response;
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
      return (response && response.data) ? response.data : response;
    } catch (error) {
      throw error;
    }
  },

  // Team-scoped: backend will resolve team from auth context
  getTeamWalletBalance: async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.WALLET}/balance`);
      return (response && response.data) ? response.data : response;
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
      return (response && response.data) ? response.data : response;
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
      return (response && response.data) ? response.data : response;
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
      return (response && response.data) ? response.data : response;
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
      return (response && response.data) ? response.data : response;
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
      return (response && response.data) ? response.data : response;
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
      return (response && response.data) ? response.data : response;
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
      return (response && response.data) ? response.data : response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get tournament data from blockchain
   */
  getTournamentDataFromBlockchain: async (tournamentId) => {
    try {
      // Backend exposes final leaderboard via POST /tournaments/bxh/:tournamentId
      const response = await apiClient.post(`${API_ENDPOINTS.TOURNAMENTS}/bxh/${tournamentId}`);
      return (response && response.data) ? response.data : response;
    } catch (error) {
      throw error;
    }
  },
};

export default blockchainService;