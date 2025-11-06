import { PlayerDashboard } from '../pages/player/Dashboard';
import { PlayerProfile } from '../pages/player/Profile';
import { MyTeam } from '../pages/player/MyTeam';
import { PlayerTournamentView } from '../pages/player/TournamentView';
import { PlayerMatchSchedule } from '../pages/player/MatchSchedule';

export const playerRoutes = [
  { path: '/player', element: <PlayerDashboard /> },
  { path: '/player/profile', element: <PlayerProfile /> },
  { path: '/player/team', element: <MyTeam /> },
  { path: '/player/tournaments', element: <PlayerTournamentView /> },
  { path: '/player/schedule', element: <PlayerMatchSchedule /> },
];