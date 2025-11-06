// ==================== src/mock/mockServices.js ====================
import {
  mockUsers,
  mockTeams,
  mockPlayers,
  mockTournaments,
  mockMatches,
  mockLeaderboard,
  mockTransactions,
  mockRewards,
  mockNotifications,
  mockStatistics,
} from './data';

// Helper: Delay để giả lập API call
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Fake token generation
const generateToken = () => {
  return 'mock_token_' + Math.random().toString(36).substring(7);
};

// ==================== Auth Mock Service ====================
export const mockAuthService = {
  login: async (credentials) => {
    await delay();
    const user = mockUsers.find(
      (u) => u.email === credentials.email && u.password === credentials.password
    );
    
    if (!user) {
      throw { message: 'Email hoặc mật khẩu không đúng' };
    }

    const token = generateToken();
    const { password, ...userWithoutPassword } = user;
    
    return {
      token,
      user: userWithoutPassword,
    };
  },

  register: async (userData) => {
    await delay();
    
    // Check if email exists
    if (mockUsers.find((u) => u.email === userData.email)) {
      throw { message: 'Email đã được sử dụng' };
    }

    const newUser = {
      id: mockUsers.length + 1,
      ...userData,
      role: 'user',
      status: 'active',
      avatar: `https://i.pravatar.cc/150?img=${mockUsers.length + 1}`,
      createdAt: new Date().toISOString(),
    };

    const token = generateToken();
    const { password, ...userWithoutPassword } = newUser;

    return {
      token,
      user: userWithoutPassword,
    };
  },

  getCurrentUser: async () => {
    await delay();
    // Return first user as example
    const { password, ...user } = mockUsers[0];
    return { user };
  },

  logout: async () => {
    await delay();
    return { success: true };
  },
};

// ==================== User Mock Service ====================
export const mockUserService = {
  getAllUsers: async (params = {}) => {
    await delay();
    return {
      users: mockUsers.map(({ password, ...user }) => user),
      total: mockUsers.length,
      page: params.page || 1,
      limit: params.limit || 10,
    };
  },

  getUserById: async (userId) => {
    await delay();
    const user = mockUsers.find((u) => u.id === parseInt(userId));
    if (!user) throw { message: 'Không tìm thấy người dùng' };
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  getFavoriteTeams: async (userId) => {
    await delay();
    // Return first 2 teams as favorites
    return {
      teams: mockTeams.slice(0, 2),
    };
  },

  getNotifications: async (userId, params = {}) => {
    await delay();
    return {
      notifications: mockNotifications.filter((n) => n.userId === parseInt(userId)),
      unreadCount: mockNotifications.filter((n) => !n.read && n.userId === parseInt(userId)).length,
    };
  },
};

// ==================== Team Mock Service ====================
export const mockTeamService = {
  getAllTeams: async (params = {}) => {
    await delay();
    return {
      teams: mockTeams,
      total: mockTeams.length,
    };
  },

  getTeamById: async (teamId) => {
    await delay();
    const team = mockTeams.find((t) => t.id === parseInt(teamId));
    if (!team) throw { message: 'Không tìm thấy đội' };
    return team;
  },

  getTeamMembers: async (teamId) => {
    await delay();
    const members = mockPlayers.filter((p) => p.teamId === parseInt(teamId));
    return { members };
  },

  getTeamRankings: async (params = {}) => {
    await delay();
    return {
      rankings: mockLeaderboard,
    };
  },

  getTeamMatches: async (teamId, params = {}) => {
    await delay();
    const matches = mockMatches.filter(
      (m) => m.team1Id === parseInt(teamId) || m.team2Id === parseInt(teamId)
    );
    return { matches };
  },

  invitePlayer: async (teamId, userId) => {
    await delay();
    return {
      success: true,
      message: 'Đã gửi lời mời thành công',
    };
  },

  removePlayer: async (teamId, playerId) => {
    await delay();
    return {
      success: true,
      message: 'Đã loại bỏ thành viên',
    };
  },
};

// ==================== Tournament Mock Service ====================
export const mockTournamentService = {
  getAllTournaments: async (params = {}) => {
    await delay();
    let tournaments = [...mockTournaments];
    
    if (params.status) {
      tournaments = tournaments.filter((t) => t.status === params.status);
    }
    
    return {
      tournaments,
      total: tournaments.length,
    };
  },

  getTournamentById: async (tournamentId) => {
    await delay();
    const tournament = mockTournaments.find((t) => t.id === parseInt(tournamentId));
    if (!tournament) throw { message: 'Không tìm thấy giải đấu' };
    return tournament;
  },

  getFeaturedTournaments: async () => {
    await delay();
    return {
      tournaments: mockTournaments.filter((t) => t.status === 'ongoing').slice(0, 3),
    };
  },

  getUpcomingTournaments: async (params = {}) => {
    await delay();
    return {
      tournaments: mockTournaments.filter((t) => t.status === 'upcoming'),
    };
  },

  getOngoingTournaments: async (params = {}) => {
    await delay();
    return {
      tournaments: mockTournaments.filter((t) => t.status === 'ongoing'),
    };
  },

  getCompletedTournaments: async (params = {}) => {
    await delay();
    return {
      tournaments: mockTournaments.filter((t) => t.status === 'completed'),
    };
  },

  getTournamentMatches: async (tournamentId, params = {}) => {
    await delay();
    const matches = mockMatches.filter((m) => m.tournamentId === parseInt(tournamentId));
    return { matches };
  },

  getLeaderboard: async (tournamentId) => {
    await delay();
    return {
      leaderboard: mockLeaderboard,
    };
  },

  registerTeam: async (tournamentId, teamId) => {
    await delay();
    return {
      success: true,
      message: 'Đăng ký thành công',
    };
  },
};

// ==================== Match Mock Service ====================
export const mockMatchService = {
  getAllMatches: async (params = {}) => {
    await delay();
    let matches = [...mockMatches];
    
    if (params.status) {
      matches = matches.filter((m) => m.status === params.status);
    }

    // Gắn thêm thông tin team & tournament
    const enriched = matches.map((match) => ({
      ...match,
      team1: mockTeams.find((t) => t.id === match.team1Id),
      team2: mockTeams.find((t) => t.id === match.team2Id),
      tournament: mockTournaments.find((t) => t.id === match.tournamentId),
    }));

    return {
      matches: enriched,
      total: enriched.length,
    };
  },

  getMatchById: async (matchId) => {
    await delay();
    const match = mockMatches.find((m) => m.id === parseInt(matchId));
    if (!match) throw { message: 'Không tìm thấy trận đấu' };

    return {
      ...match,
      team1: mockTeams.find((t) => t.id === match.team1Id),
      team2: mockTeams.find((t) => t.id === match.team2Id),
      tournament: mockTournaments.find((t) => t.id === match.tournamentId),
    };
  },

  getLiveMatches: async () => {
    await delay();
    const live = mockMatches
      .filter((m) => m.status === 'live')
      .map((match) => ({
        ...match,
        team1: mockTeams.find((t) => t.id === match.team1Id),
        team2: mockTeams.find((t) => t.id === match.team2Id),
        tournament: mockTournaments.find((t) => t.id === match.tournamentId),
      }));
    return { matches: live };
  },

  getUpcomingMatches: async () => {
    await delay();
    const upcoming = mockMatches
      .filter((m) => m.status === 'scheduled')
      .map((match) => ({
        ...match,
        team1: mockTeams.find((t) => t.id === match.team1Id),
        team2: mockTeams.find((t) => t.id === match.team2Id),
        tournament: mockTournaments.find((t) => t.id === match.tournamentId),
      }));
    return { matches: upcoming };
  },

  getCompletedMatches: async () => {
    await delay();
    const completed = mockMatches
      .filter((m) => m.status === 'completed')
      .map((match) => ({
        ...match,
        team1: mockTeams.find((t) => t.id === match.team1Id),
        team2: mockTeams.find((t) => t.id === match.team2Id),
        tournament: mockTournaments.find((t) => t.id === match.tournamentId),
      }));
    return { matches: completed };
  },

  getMatchesByTeam: async (teamId) => {
    await delay();
    const matches = mockMatches
      .filter(
        (m) => m.team1Id === parseInt(teamId) || m.team2Id === parseInt(teamId)
      )
      .map((match) => ({
        ...match,
        team1: mockTeams.find((t) => t.id === match.team1Id),
        team2: mockTeams.find((t) => t.id === match.team2Id),
        tournament: mockTournaments.find((t) => t.id === match.tournamentId),
      }));
    return { matches };
  },

  updateMatchResult: async (matchId, resultData) => {
    await delay();
    return {
      success: true,
      message: 'Cập nhật kết quả thành công',
      updated: { id: matchId, ...resultData },
    };
  },
};
// ==================== Blockchain Mock Service ====================
export const mockBlockchainService = {
  getAllTransactions: async (params = {}) => {
    await delay();
    return {
      transactions: mockTransactions,
      total: mockTransactions.length,
    };
  },

  getTransactionByHash: async (txHash) => {
    await delay();
    const transaction = mockTransactions.find((t) => t.txHash === txHash);
    if (!transaction) throw { message: 'Không tìm thấy giao dịch' };
    return transaction;
  },

  getWalletTransactions: async (walletAddress, params = {}) => {
    await delay();
    const transactions = mockTransactions.filter(
      (t) => t.to === walletAddress || t.from === walletAddress
    );
    return { transactions };
  },

  storeMatchResult: async (matchId) => {
    await delay();
    return {
      success: true,
      txHash: '0x' + Math.random().toString(16).substring(2, 66),
      message: 'Đã lưu kết quả lên blockchain',
    };
  },

  distributeRewards: async (tournamentId, distributionData) => {
    await delay();
    return {
      success: true,
      txHash: '0x' + Math.random().toString(16).substring(2, 66),
      message: 'Đã phân phối phần thưởng',
    };
  },

  getBlockchainStats: async () => {
    await delay();
    return {
      totalTransactions: mockTransactions.length,
      totalRewardsDistributed: 2500000,
      pendingTransactions: mockTransactions.filter((t) => t.status === 'pending').length,
    };
  },
};

// ==================== Reward Mock Service ====================
export const mockRewardService = {
  getAllRewards: async (params = {}) => {
    await delay();
    return {
      rewards: mockRewards,
      total: mockRewards.length,
    };
  },

  getPendingRewards: async (params = {}) => {
    await delay();
    return {
      rewards: mockRewards.filter((r) => !r.distributed),
    };
  },

  getDistributedRewards: async (params = {}) => {
    await delay();
    return {
      rewards: mockRewards.filter((r) => r.distributed),
    };
  },

  getTournamentRewards: async (tournamentId) => {
    await delay();
    const rewards = mockRewards.filter((r) => r.tournamentId === parseInt(tournamentId));
    return { rewards };
  },

  getTeamRewards: async (teamId, params = {}) => {
    await delay();
    const rewards = mockRewards.filter((r) => r.recipientId === parseInt(teamId) && r.recipientType === 'team');
    return { rewards };
  },

  executeRewardDistribution: async (rewardId) => {
    await delay();
    return {
      success: true,
      txHash: '0x' + Math.random().toString(16).substring(2, 66),
      message: 'Phần thưởng đã được phân phối',
    };
  },
};

// ==================== Statistics Mock Service ====================
export const mockSystemStats = async () => {
  await delay();
  return mockStatistics;
};