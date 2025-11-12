import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Bars3Icon, BellIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { Menu, Transition } from "@headlessui/react";
import { useAuth } from "../../context/AuthContext";
import Button from '../common/Button';
import { apiClient } from '../../services/api';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth(); // Lấy user từ AuthContext

  const [unreadCount, setUnreadCount] = useState(0);
  const [games, setGames] = useState([]);
  const [seasons, setSeasons] = useState([]);

  const [isStandingsOpen, setStandingsOpen] = useState(false);
  const [openGame, setOpenGame] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);

  const dropdownRef = useRef(null);

  // Lấy số lượng thông báo chưa đọc
  useEffect(() => {
    if (!user) return; // Chỉ fetch khi đã login
    
    async function fetchUnreadCount() {
      try {
        const data = await apiClient.get('/notifications/unread-count');
        setUnreadCount(data?.count || 0);
      } catch (error) {
        console.error('Lỗi lấy số thông báo:', error);
      }
    }
    fetchUnreadCount();

    // Polling mỗi 30 giây để cập nhật thông báo
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Lấy danh sách games
  useEffect(() => {
    async function fetchGames() {
      try {
        const data = await apiClient.get('/games');
        setGames(data || []);
      } catch (error) {
        console.error('Lỗi lấy games:', error);
        setGames([]);
      }
    }
    fetchGames();
  }, []);

  // Lấy danh sách seasons
  useEffect(() => {
    async function fetchSeasons() {
      try {
        const data = await apiClient.get('/seasons');
        setSeasons(data || []);
      } catch (error) {
        console.error('Lỗi lấy seasons:', error);
        setSeasons([]);
      }
    }
    fetchSeasons();
  }, []);

  // Click ngoài menu để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setStandingsOpen(false);
        setOpenGame(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSeason = (game, season) => {
    setSelectedGame(game);
    setStandingsOpen(false);
    setOpenGame(null);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0a0a0a] border-b border-neutral-800 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 h-20">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition"
          >
            <Bars3Icon className="h-7 w-7" />
          </button>

          <Link to="/" className="flex items-center gap-3">
            <img
              src="https://cdn-icons-png.flaticon.com/512/5968/5968705.png"
              alt="EsportChain Logo"
              className="h-10 w-10"
            />
            <span className="text-2xl font-bold text-white tracking-wide">EsportChain</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-10 text-base font-semibold text-gray-300">
          <Link to="/" className="hover:text-white transition">Trang chủ</Link>
          <Link to="/schedule" className="hover:text-white transition">Lịch thi đấu</Link>

          {/* Dropdown Bảng xếp hạng */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setStandingsOpen(!isStandingsOpen)}
              className="hover:text-white transition flex items-center gap-1"
            >
              Bảng xếp hạng
              <svg
                className={`w-4 h-4 mt-1 transition-transform duration-200 ${
                  isStandingsOpen ? "rotate-180" : "rotate-0"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isStandingsOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-md shadow-lg z-50">
                {games.length === 0 && (
                  <div className="p-4 text-center text-gray-500">Đang tải...</div>
                )}
                {games.map((game) => (
                  <div key={game.id || game.name} className="relative group">
                    <button
                      onClick={() => setOpenGame(openGame === game.name ? null : game.name)}
                      className={`w-full text-left px-4 py-2 mb-1 flex justify-between items-center transition-colors ${
                        openGame === game.name ? "bg-neutral-700 text-white" : "text-gray-300 hover:bg-neutral-800 hover:text-white"
                      }`}
                    >
                      <span>{game.name}</span>
                      <svg
                        className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {openGame === game.name && (
                      <div className="absolute top-0 left-full mt-0 ml-2 w-48 bg-neutral-900 border border-neutral-700 rounded-md shadow-lg z-50">
                        {seasons.length === 0 && (
                          <div className="p-4 text-center text-gray-500">Đang tải...</div>
                        )}
                        {seasons.map((season) => (
                          <button
                            key={season.id || season.name}
                            onClick={() => {
                              handleSelectSeason(game.name, season.name);
                            }}
                            className="w-full text-left px-4 py-2 text-gray-300 hover:bg-neutral-800 hover:text-white"
                          >
                            {season.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link to="/vods" className="hover:text-white transition">Video</Link>
          <Link to="/teams" className="hover:text-white transition">Đội tuyển</Link>
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-6">
          {/* Notifications - Chỉ hiển thị khi đã login */}
          {user && (
            <Link
              to="/notifications"
              className="relative p-2 text-gray-400 hover:text-white transition"
            >
              <BellIcon className="h-7 w-7" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-5 w-5 bg-red-600 rounded-full flex items-center justify-center text-xs text-white">
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
                          to="/profile"
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