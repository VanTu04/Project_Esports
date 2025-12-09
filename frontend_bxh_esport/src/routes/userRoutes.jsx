import { UserProfile } from '../pages/user/Profile';
import { TournamentBrowse } from '../pages/user/TournamentBrowse';
import { Donate } from '../pages/user/Donate';
import Settings from '../pages/user/Settings';
import TwoFactorSetup from '../pages/user/TwoFactorSetup';

export const userRoutes = [
  { path: '/users/profile', element: <UserProfile /> },
  { path: '/users/tournaments', element: <TournamentBrowse /> },
  { path: '/users/donate', element: <Donate /> },
  { path: '/settings', element: <Settings /> },
  { path: '/users/settings', element: <Settings /> },
  { path: '/settings/2fa', element: <TwoFactorSetup /> },
  { path: '/users/settings/2fa', element: <TwoFactorSetup /> },
];
