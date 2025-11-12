import { AdminDashboard } from '../pages/admin/Dashboard';
import { UserManagement } from '../pages/admin/UserManagement';
import { TeamManagement } from '../pages/admin/TeamManagement';
import GameManagementPage from '../pages/admin/GameManagement';
import { TournamentManagement } from '../pages/admin/TournamentManagement';
import { MatchResultUpdate } from '../pages/admin/MatchResultUpdate';
import { RewardDistribution } from '../pages/admin/RewardDistribution';
import { BlockchainTransactions } from '../pages/admin/BlockchainTransactions';
import { SystemStatistics } from '../pages/admin/SystemStatistics';

export const adminRoutes = [
  { path: '/admin', element: <AdminDashboard /> },
  { path: '/admin/users', element: <UserManagement /> },
  { path: '/admin/teams', element: <TeamManagement /> },
  { path: '/admin/games', element: <GameManagementPage /> },
  { path: '/admin/tournaments', element: <TournamentManagement /> },
  { path: '/admin/matches', element: <MatchResultUpdate /> },
  { path: '/admin/rewards', element: <RewardDistribution /> },
  { path: '/admin/blockchain', element: <BlockchainTransactions /> },
  { path: '/admin/statistics', element: <SystemStatistics /> },
];
