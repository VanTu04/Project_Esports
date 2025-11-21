import Home from '../pages/public/Home';
import { TournamentPublic } from '../pages/public/TournamentPublic';
import { Leaderboard } from '../pages/public/Leaderboard';
import Schedule from '../pages/public/Schedule';
import { TeamPublicView } from '../pages/public/TeamPublicView';
import Wallet from '../pages/public/Wallet';
import TournamentDetailPage from '../pages/public/TournamentDetailPage';

export const publicRoutes = [
  { path: '/', element: <Home /> },
  { path: '/tournaments', element: <TournamentPublic /> },
  { path: '/tournaments/:tournamentId', element: <TournamentDetailPage /> },
  { path: '/schedule', element: <Schedule /> },
  { path: '/wallet', element: <Wallet /> },
  { path: '/leaderboard', element: <Leaderboard /> },
  { path: '/teams', element: <TeamPublicView /> },
];
