import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  TrophyIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  WalletIcon,
  UsersIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES, ROUTES } from '../../utils/constants';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const getMenuItems = () => {
    const role = user?.role;

    switch (role) {
      case USER_ROLES.ADMIN:
        return [
          { icon: HomeIcon, label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD },
          { icon: UsersIcon, label: 'Người dùng', path: ROUTES.ADMIN_USERS },
          { icon: TrophyIcon, label: 'Giải đấu', path: ROUTES.ADMIN_TOURNAMENTS },
          { icon: ChartBarIcon, label: 'Trò chơi', path: ROUTES.ADMIN_GAMES },
          { icon: WalletIcon, label: 'Phần thưởng', path: ROUTES.ADMIN_REWARDS },
          { icon: ChartBarIcon, label: 'Blockchain', path: ROUTES.ADMIN_BLOCKCHAIN },
          { icon: ChartBarIcon, label: 'Thống kê', path: ROUTES.ADMIN_STATISTICS },
        ];

      case USER_ROLES.TEAM_MANAGER:
        return [
          { icon: HomeIcon, label: 'Dashboard', path: ROUTES.TEAM_MANAGER_DASHBOARD },
          { icon: UserGroupIcon, label: 'Thông tin đội', path: ROUTES.TEAM_MANAGER_INFO },
          { icon: UsersIcon, label: 'Thành viên', path: ROUTES.TEAM_MANAGER_PLAYERS },
          { icon: TrophyIcon, label: 'Giải đấu', path: ROUTES.TEAM_MANAGER_TOURNAMENTS },
          { icon: FlagIcon, label: 'Lịch thi đấu', path: ROUTES.TEAM_MANAGER_MATCHES },
          { icon: WalletIcon, label: 'Ví blockchain', path: ROUTES.TEAM_MANAGER_WALLET },
          { icon: CogIcon, label: 'Báo cáo', path: ROUTES.TEAM_MANAGER_REPORTS },
        ];

      case USER_ROLES.PLAYER:
        return [
          { icon: HomeIcon, label: 'Dashboard', path: ROUTES.PLAYER_DASHBOARD },
          { icon: UsersIcon, label: 'Hồ sơ', path: ROUTES.PLAYER_PROFILE },
          { icon: UserGroupIcon, label: 'Đội của tôi', path: ROUTES.PLAYER_TEAM },
          { icon: TrophyIcon, label: 'Giải đấu', path: ROUTES.PLAYER_TOURNAMENTS },
          { icon: FlagIcon, label: 'Lịch thi đấu', path: ROUTES.PLAYER_SCHEDULE },
        ];

      default: // USER
        return [
          { icon: HomeIcon, label: 'Trang chủ', path: ROUTES.HOME },
          { icon: TrophyIcon, label: 'Giải đấu', path: ROUTES.TOURNAMENTS },
          { icon: ChartBarIcon, label: 'Bảng xếp hạng', path: ROUTES.LEADERBOARD },
          { icon: UserGroupIcon, label: 'Đội tuyển', path: ROUTES.TEAMS },
          { icon: UsersIcon, label: 'Hồ sơ', path: ROUTES.USER_PROFILE },
        ];
    }
  };

  const menuItems = getMenuItems();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          // place the sidebar below the fixed header (header height = h-20)
          // use calc to set height = 100vh - headerHeight so it doesn't overflow
          'fixed top-20 left-0 z-40 w-64 bg-dark-500 border-r border-primary-700/30 transition-transform duration-300',
          // on larger screens keep it visible (no translate) and ensure it can scroll
          isOpen ? 'translate-x-0 h-[calc(100vh-5rem)]' : '-translate-x-full lg:translate-x-0 lg:h-[calc(100vh-5rem)]'
        )}
      >
        <div className="flex flex-col h-full">

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <ul className="space-y-1">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive(item.path)
                        ? 'bg-gradient-gold text-white shadow-gold'
                        : 'text-gray-400 hover:text-white hover:bg-dark-400'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-primary-700/30">
            <div className="text-xs text-gray-500 text-center">
              © 2024 Esports League
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;