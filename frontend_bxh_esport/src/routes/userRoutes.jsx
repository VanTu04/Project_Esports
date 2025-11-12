import { UserDashboard } from '../pages/user/Dashboard';
import { UserProfile } from '../pages/user/Profile';
import { TournamentBrowse } from '../pages/user/TournamentBrowse';
import { FavoriteTeams } from '../pages/user/FavoriteTeams';
import { Donate } from '../pages/user/Donate';

export const userRoutes = [
  { path: '/users', element: <UserDashboard /> },
  { path: '/users/profile', element: <UserProfile /> },
  { path: '/users/tournaments', element: <TournamentBrowse /> },
  { path: '/users/favorites', element: <FavoriteTeams /> },
  { path: '/users/donate', element: <Donate /> },
  
];
