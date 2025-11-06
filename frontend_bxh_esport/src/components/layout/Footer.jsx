import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-dark-500 border-t border-primary-700/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-4">Về chúng tôi</h3>
            <p className="text-gray-400 text-sm">
              Nền tảng quản lý giải đấu Esports với công nghệ Blockchain
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Liên kết</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/tournaments" className="text-gray-400 hover:text-primary-500">
                  Giải đấu
                </Link>
              </li>
              <li>
                <Link to="/teams" className="text-gray-400 hover:text-primary-500">
                  Đội tuyển
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-gray-400 hover:text-primary-500">
                  Bảng xếp hạng
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-primary-500">
                  Trung tâm trợ giúp
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary-500">
                  Liên hệ
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary-500">
                  Điều khoản
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-semibold mb-4">Mạng xã hội</h3>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-primary-500">
                Facebook
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-500">
                Twitter
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-500">
                Discord
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-primary-700/30 text-center text-sm text-gray-500">
          © 2024 Esports League. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;