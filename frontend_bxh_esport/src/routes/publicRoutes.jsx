import Home from '../pages/public/Home';
import { TournamentPublic } from '../pages/public/TournamentPublic';
import { Leaderboard } from '../pages/public/Leaderboard';
import Schedule from '../pages/public/Schedule';
import { TeamPublicView } from '../pages/public/TeamPublicView';

export const publicRoutes = [
  { path: '/', element: <Home /> },
  { path: '/tournaments', element: <TournamentPublic /> },
  { path: '/schedule', element: <Schedule /> },
  { path: '/leaderboard', element: <Leaderboard /> },
  { path: '/teams', element: <TeamPublicView /> },
];
