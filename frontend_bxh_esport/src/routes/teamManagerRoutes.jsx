import { TeamManagerDashboard } from '../pages/team-manager/Dashboard';
import { TeamInfo } from '../pages/team-manager/TeamInfo';
import { PlayerManagement } from '../pages/team-manager/PlayerManagement';
import { TournamentRegistration } from '../pages/team-manager/TournamentRegistration';
import { MatchHistory } from '../pages/team-manager/MatchHistory';
import { BlockchainWallet } from '../pages/team-manager/BlockchainWallet';

export const teamManagerRoutes = [
  { path: '/team-managers', element: <TeamManagerDashboard /> },
  { path: '/team-managers/team-info', element: <TeamInfo /> },
  { path: '/team-managers/players', element: <PlayerManagement /> },
  { path: '/team-managers/tournaments', element: <TournamentRegistration /> },
  { path: '/team-managers/matches', element: <MatchHistory /> },
  { path: '/team-managers/wallet', element: <BlockchainWallet /> },
];