import Home from '../pages/public/Home';
import { TournamentPublic } from '../pages/public/TournamentPublic';
import { Leaderboard } from '../pages/public/Leaderboard';
import Schedule from '../pages/public/Schedule';
import { TeamPublicView } from '../pages/public/TeamPublicView';
import Wallet from '../pages/public/Wallet';

export const publicRoutes = [
  { path: '/', element: <Home /> },
  { path: '/tournaments', element: <TournamentPublic /> },
  { path: '/schedule', element: <Schedule /> },
  { path: '/wallet', element: <Wallet /> },
  { path: '/leaderboard', element: <Leaderboard /> },
  { path: '/teams', element: <TeamPublicView /> },
];
