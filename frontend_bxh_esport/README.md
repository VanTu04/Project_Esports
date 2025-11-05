eSports Ranking Platform - Frontend
Nền tảng quản lý giải đấu eSports với tích hợp Blockchain.

Tính năng chính
✅ Đăng nhập/Đăng ký với phân quyền (Admin, Team Manager, Player, User)
✅ Dashboard riêng cho từng role
✅ Quản lý giải đấu, đội tuyển, người chơi
✅ Cập nhật kết quả trận đấu
✅ Tích hợp Blockchain để lưu kết quả và phân phối giải thưởng
✅ Bảng xếp hạng realtime
✅ Responsive design với Tailwind CSS
Công nghệ sử dụng
React 18 - UI Library
Vite - Build tool
React Router v6 - Routing
Axios - HTTP Client
Tailwind CSS - Styling
Lucide React - Icons
Cài đặt
1. Clone repository
bash
git clone <repository-url>
cd esports-ranking-frontend
2. Cài đặt dependencies
bash
npm install
3. Cấu hình môi trường
Tạo file .env trong thư mục root:

env
VITE_API_URL=http://localhost:8081/api
4. Chạy development server
bash
npm run dev
Ứng dụng sẽ chạy tại: http://localhost:3000

5. Build cho production
bash
npm run build
Cấu trúc thư mục
src/
├── assets/              # Static files (images, styles)
│   ├── images/
│   ├── icons/
│   └── styles/
│       └── global.css
├── components/          # Reusable components
│   ├── common/         # Common components (Button, Modal, Table...)
│   ├── layout/         # Layout components (Header, Sidebar, Footer)
│   ├── auth/           # Auth components (LoginForm, RegisterForm...)
│   ├── tournament/     # Tournament components
│   ├── team/           # Team components
│   ├── player/         # Player components
│   └── blockchain/     # Blockchain components
├── pages/              # Page components
│   ├── public/         # Public pages
│   ├── auth/           # Auth pages
│   ├── admin/          # Admin pages
│   ├── team-manager/   # Team Manager pages
│   ├── player/         # Player pages
│   └── user/           # User pages
├── services/           # API services
│   ├── api.js
│   ├── authService.js
│   ├── userService.js
│   ├── teamService.js
│   ├── tournamentService.js
│   └── ...
├── context/            # React Context
│   ├── AuthContext.jsx
│   ├── Web3Context.jsx
│   └── ...
├── hooks/              # Custom hooks
│   ├── useAuth.js
│   ├── useWeb3.js
│   └── ...
├── utils/              # Utility functions
│   ├── constants.js
│   ├── helpers.js
│   ├── validators.js
│   └── ...
├── routes/             # Route configuration
│   └── index.jsx
├── App.jsx             # Main App component
└── main.jsx           # Entry point
Phân quyền người dùng
1. Admin
Quản lý toàn bộ hệ thống
Quản lý người dùng, đội, giải đấu
Cập nhật kết quả trận đấu
Phân phối giải thưởng qua Blockchain
Xem thống kê tổng quan
2. Team Manager
Quản lý thông tin đội
Quản lý thành viên (player)
Đăng ký giải đấu
Xem lịch thi đấu và kết quả
Quản lý ví Blockchain của đội
3. Player
Xem hồ sơ cá nhân
Xem thông tin đội
Xem lịch thi đấu
Xem thống kê cá nhân
4. User (Người dùng thông thường)
Xem giải đấu, bảng xếp hạng
Theo dõi đội yêu thích
Xem thông tin công khai
API Endpoints
Tất cả API endpoints được định nghĩa trong src/utils/constants.js:

javascript
// Auth
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
POST /api/auth/logout

// Users
GET    /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
GET    /api/users/profile
PUT    /api/users/profile

// Teams
GET    /api/teams
POST   /api/teams
GET    /api/teams/:id
PUT    /api/teams/:id
DELETE /api/teams/:id
GET    /api/teams/:id/members
POST   /api/teams/:id/members

// Tournaments
GET    /api/tournaments
POST   /api/tournaments
GET    /api/tournaments/:id
PUT    /api/tournaments/:id
DELETE /api/tournaments/:id
GET    /api/tournaments/:id/leaderboard

// Matches
GET    /api/matches
POST   /api/matches
PUT    /api/matches/:id/results

// Blockchain
GET    /api/blockchain/transactions
POST   /api/blockchain/rewards
Authentication Flow
User đăng nhập → nhận access token + refresh token
Access token được lưu trong localStorage
Mọi request đều tự động thêm Bearer token vào header
Khi token hết hạn, tự động refresh token
Nếu refresh thất bại → redirect về login
Responsive Design
Mobile: < 768px
Tablet: 768px - 1024px
Desktop: > 1024px
Tất cả components đều responsive với Tailwind CSS breakpoints.

Scripts
bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
Lưu ý
Backend API: Đảm bảo backend đang chạy tại http://localhost:8081
CORS: Backend cần cấu hình CORS cho phép frontend truy cập
Blockchain: Cần MetaMask hoặc wallet khác để kết nối blockchain
Environment: Đảm bảo file .env được cấu hình đúng
Troubleshooting
Lỗi kết nối API
bash
# Kiểm tra backend đang chạy
curl http://localhost:8081/api/health

# Kiểm tra file .env
cat .env
Lỗi CORS
Backend cần cấu hình CORS:

javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
Lỗi build
bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
Đóng góp
Fork repository
Tạo branch mới (git checkout -b feature/amazing-feature)
Commit changes (git commit -m 'Add amazing feature')
Push to branch (git push origin feature/amazing-feature)
Tạo Pull Request
License
MIT License - xem file LICENSE để biết thêm chi tiết.

Liên hệ
Email: support@esports-platform.com
Website: https://esports-platform.com
