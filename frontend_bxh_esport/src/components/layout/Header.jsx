import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bars3Icon, BellIcon, UserCircleIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Menu, Transition } from "@headlessui/react";
import { useAuth } from "../../context/AuthContext";
import { USER_ROLES, ROUTES } from '../../utils/constants';
import Button from '../common/Button';
import { apiClient } from '../../services/api';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth(); // Lấy user từ AuthContext
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);

  // TODO: Implement notifications API endpoint
  // Lấy số lượng thông báo chưa đọc
  useEffect(() => {
    if (!user) return; // Chỉ fetch khi đã login
    
    // Temporarily disabled - waiting for backend API implementation
    // async function fetchUnreadCount() {
    //   try {
    //     const data = await apiClient.get('/notifications/unread-count');
    //     setUnreadCount(data?.count || 0);
    //   } catch (error) {
    //     console.error('Lỗi lấy số thông báo:', error);
    //   }
    // }
    // fetchUnreadCount();

    // // Polling mỗi 30 giây để cập nhật thông báo
    // const interval = setInterval(fetchUnreadCount, 30000);
    // return () => clearInterval(interval);
    
    // For now, just set to 0
    setUnreadCount(0);
  }, [user]);

  // (Standings dropdown removed — header now links directly to leaderboard)

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0a0a0a] border-b border-neutral-800 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 h-20">
        {/* Logo */}
        <div className="flex items-center gap-4">
          {/* Menu button - chỉ hiển thị khi đã đăng nhập */}
          {user && (
            <button
              onClick={onMenuClick}
              className="p-2 text-gray-400 hover:text-white transition"
              title="Menu"
            >
              <Bars3Icon className="h-7 w-7" />
            </button>
          )}

          {/* Logo - chỉ hiển thị, không điều hướng */}
          <div className="flex items-center gap-3">
            <img
              src="https://cdn-icons-png.flaticon.com/512/5968/5968705.png"
              alt="EsportChain Logo"
              className="h-10 w-10"
            />
            <span className="text-2xl font-bold text-white tracking-wide">EsportChain</span>
          </div>
        </div>

        {/* Navigation - expanded to match demo */}
        <nav className="hidden lg:flex items-center gap-6 text-base font-semibold text-gray-300">
          <Link 
            to="/" 
            className={`hover:text-white transition px-2 py-1 rounded ${
              location.pathname === '/' ? 'text-primary-500 bg-primary-500/10' : ''
            }`}
          >
            Trang chủ
          </Link>
          <Link 
            to="/tournaments" 
            className={`hover:text-white transition px-2 py-1 rounded ${
              location.pathname === '/tournaments' ? 'text-primary-500 bg-primary-500/10' : ''
            }`}
          >
            Giải đấu
          </Link>
          <Link 
            to="/teams" 
            className={`hover:text-white transition px-2 py-1 rounded ${
              location.pathname === '/teams' ? 'text-primary-500 bg-primary-500/10' : ''
            }`}
          >
            Đội tuyển
          </Link>
          <Link 
            to="/schedule" 
            className={`hover:text-white transition px-2 py-1 rounded ${
              location.pathname === '/schedule' ? 'text-primary-500 bg-primary-500/10' : ''
            }`}
          >
            Lịch thi đấu
          </Link>
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-6">
          {/* Search icon */}
          <Link to="/search" className="p-2 text-gray-400 hover:text-white transition hidden md:inline-flex">
            <MagnifyingGlassIcon className="h-6 w-6" />
          </Link>

          {/* Notifications - Chỉ hiển thị khi đã login */}
          {user && (
            <Link
              to="/notifications"
              className="relative p-2 text-gray-400 hover:text-white transition"
            >
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 h-5 w-5 bg-red-600 rounded-full flex items-center justify-center text-xs text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* User area */}
          {user ? (
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center gap-2 p-2 text-gray-400 hover:text-white transition">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name || user.username}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="h-7 w-7" />
                )}
                <span className="hidden sm:block text-base text-white font-medium">
                  {user.name || user.username || user.email || "Tài khoản"}
                </span>
              </Menu.Button>

              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Menu.Items className="absolute right-0 mt-2 w-52 bg-neutral-900 border border-neutral-700 rounded-md shadow-lg focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/users/profile"
                          className={`${active ? "bg-neutral-800" : ""} block px-4 py-2 text-base text-gray-300 hover:text-white`}
                        >
                          Hồ sơ
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/settings"
                          className={`${active ? "bg-neutral-800" : ""} block px-4 py-2 text-base text-gray-300 hover:text-white`}
                        >
                          Cài đặt
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={logout}
                          className={`${active ? "bg-neutral-800" : ""} block w-full text-left px-4 py-2 text-base text-gray-300 hover:text-white`}
                        >
                          Đăng xuất
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="md">Đăng nhập</Button>
              </Link>
              <Link to="/register">
                <Button size="md">Đăng ký</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;