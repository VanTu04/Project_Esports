// API Base URL
// Có thể set trong env (VITE_API_BASE_URL) hoặc mặc định '/api'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Theme Colors (Esport Style)
export const THEME_COLORS = {
  primary: '#C89B3C',       // Gold
  primaryDark: '#A07628',
  primaryLight: '#F0E6D2',
  secondary: '#0397AB',     // Cyan
  background: '#010A13',
  backgroundLight: '#0A1428',
  backgroundCard: '#091428',
  text: '#F0E6D2',
  textSecondary: '#A09B8C',
  textMuted: '#5B5A56',
  borderColor: '#1E2328',   // Đổi tên tránh trùng "border-border"
  success: '#0BC261',
  error: '#D13639',
  warning: '#F0B232',
  live: '#FF4655',
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  TEAM_MANAGER: 'team_manager',
  PLAYER: 'player',
  USER: 'user',
};

// Role Display Names
export const ROLE_NAMES = {
  [USER_ROLES.ADMIN]: 'Admin',
  [USER_ROLES.TEAM_MANAGER]: 'Team Manager',
  [USER_ROLES.PLAYER]: 'Player',
  [USER_ROLES.USER]: 'User',
};

// Tournament Statuses
export const TOURNAMENT_STATUS = {
  DRAFT: 'draft',
  REGISTRATION: 'registration',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Match Statuses
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Team Statuses
export const TEAM_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
};

// Player Statuses
export const PLAYER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

// Registration Statuses
export const REGISTRATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Game Types (dùng cho dropdown, select)
export const GAME_TYPES = [
  { value: 'valorant', label: 'Valorant' },
  { value: 'lol', label: 'League of Legends' },
  { value: 'dota2', label: 'Dota 2' },
  { value: 'csgo', label: 'CS:GO' },
  { value: 'pubg', label: 'PUBG' },
  { value: 'fifa', label: 'FIFA' },
];

// Pagination config
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'AUTH_TOKEN',
  USER_DATA: 'USER_DATA',
  WALLET_ADDRESS: 'WALLET_ADDRESS',
  THEME: 'theme',
  ACCESS_TOKEN: 'access_token', // backward compatibility
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
};

// Toast duration (ms)
export const TOAST_DURATION = 3000;

// Blockchain config
export const BLOCKCHAIN_NETWORK = {
  CHAIN_ID: '0x1', // Ethereum Mainnet
  NETWORK_NAME: 'Ethereum',
};

// API Endpoints (relative paths, dùng chung với baseURL)
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/users/login',
  REGISTER: '/users/register',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',

  // Users
  USERS: '/users',
  USER_PROFILE: '/users/profile',

  // Teams
  TEAMS: '/teams',
  TEAM_MEMBERS: '/teams/:id/members',
  TEAM_INVITATIONS: '/teams/:id/invitations',

  // Players
  PLAYERS: '/players',
  PLAYER_STATS: '/players/:id/stats',

  // Tournaments
  TOURNAMENTS: '/tournaments',
  TOURNAMENT_REGISTRATIONS: '/tournaments/:id/registrations',
  TOURNAMENT_LEADERBOARD: '/tournaments/:id/leaderboard',

  // Matches
  MATCHES: '/matches',
  MATCH_RESULTS: '/matches/:id/results',

  // Blockchain
  BLOCKCHAIN_TRANSACTIONS: '/blockchain/transactions',
  BLOCKCHAIN_REWARDS: '/blockchain/rewards',
  BLOCKCHAIN_WALLET: '/blockchain/wallet',

  // Reports
  REPORTS: '/reports',
  COMPLAINTS: '/complaints',
};

// Frontend Routes (dùng với react-router Link / navigate)
export const ROUTES = {
  // Admin routes
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_TEAMS: '/admin/teams',
  ADMIN_TOURNAMENTS: '/admin/tournaments',
  ADMIN_MATCHES: '/admin/matches',
  ADMIN_REWARDS: '/admin/rewards',
  ADMIN_BLOCKCHAIN: '/admin/blockchain',
  ADMIN_STATISTICS: '/admin/statistics',

  // Team Manager routes
  TEAM_MANAGER_DASHBOARD: '/team-manager',
  TEAM_MANAGER_INFO: '/team-manager/team-info',
  TEAM_MANAGER_PLAYERS: '/team-manager/players',
  TEAM_MANAGER_TOURNAMENTS: '/team-manager/tournaments',
  TEAM_MANAGER_MATCHES: '/team-manager/matches',
  TEAM_MANAGER_WALLET: '/team-manager/wallet',
  TEAM_MANAGER_REPORTS: '/team-manager/reports',

  // Player routes
  PLAYER_DASHBOARD: '/player',
  PLAYER_PROFILE: '/player/profile',
  PLAYER_TEAM: '/player/team',
  PLAYER_TOURNAMENTS: '/player/tournaments',
  PLAYER_SCHEDULE: '/player/schedule',

  // Public / User routes
  HOME: '/',
  TOURNAMENTS: '/tournaments',
  LEADERBOARD: '/leaderboard',
  TEAMS: '/teams',
  USER_PROFILE: '/user/profile',
};
