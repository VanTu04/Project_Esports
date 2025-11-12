import { useEffect, useState } from 'react';
import { mockTeamService } from '../../mock/mockServices';


const saveLeaderboardData = (data) => {
  localStorage.setItem('leaderboards', JSON.stringify(data));
};

const loadLeaderboardData = () => {
  try {
    const stored = localStorage.getItem('leaderboards');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const TournamentManagement = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTournaments, setSelectedTournaments] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [rankingTeams, setRankingTeams] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [tournamentStatus, setTournamentStatus] = useState('upcoming');
  const [saving, setSaving] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedLeaderboardId, setSelectedLeaderboardId] = useState(null);
  const [statusEditing, setStatusEditing] = useState('');
  const [savingLeaderboard, setSavingLeaderboard] = useState(false);
  const [leaderboardsByTournament, setLeaderboardsByTournament] = useState(() => loadLeaderboardData());
  
  
  // Statistics state
  const [stats, setStats] = useState({
    total: 156,
    active: 12,
    upcoming: 8,
    completed: 136,
    totalTeams: 2456,
    totalMatches: 8924,
    totalPrizePool: 2500000,
    issues: 3
  });

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    game: '',
    season: '',
    status: '',
    format: '',
    region: ''
  });

  // Quick filter state
  const [quickFilter, setQuickFilter] = useState('all');

  useEffect(() => {
    loadTournaments();
  }, [filters, quickFilter]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      // Simulated API call - replace with actual service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockTournaments = [
        {
          id: 1,
          name: 'Spring Championship 2024',
          game: 'League of Legends',
          season: 'Spring 2024',
          status: 'live',
          teams: { current: 16, max: 16 },
          matches: { played: 45, total: 64 },
          prizePool: 50000,
          paidPercentage: 80,
          startDate: '2024-01-15',
          endDate: '2024-02-28',
          duration: 45,
          featured: true,
          issues: 0
        },
        {
          id: 2,
          name: 'Summer Open 2024',
          game: 'CS2',
          season: 'Summer 2024',
          status: 'upcoming',
          teams: { current: 8, max: 32, pending: 2 },
          matches: { played: 0, total: 0 },
          prizePool: 25000,
          paidPercentage: 0,
          startDate: '2024-03-01',
          endDate: '2024-04-15',
          duration: 0,
          daysUntil: 15,
          featured: false,
          issues: 0
        },
        {
          id: 3,
          name: 'Winter Major 2023',
          game: 'Dota 2',
          season: 'Winter 2023',
          status: 'completed',
          teams: { current: 16, max: 16 },
          matches: { played: 64, total: 64 },
          prizePool: 100000,
          paidPercentage: 100,
          startDate: '2023-12-01',
          endDate: '2024-01-15',
          duration: 60,
          featured: false,
          issues: 0
        },
        {
          id: 4,
          name: 'Fall Cup 2024',
          game: 'Valorant',
          season: 'Fall 2024',
          status: 'draft',
          teams: { current: 0, max: 24 },
          matches: { played: 0, total: 0 },
          prizePool: 15000,
          paidPercentage: 0,
          startDate: null,
          endDate: null,
          duration: 0,
          featured: false,
          issues: 0
        },
        {
          id: 5,
          name: 'Regional Qualifiers',
          game: 'League of Legends',
          season: 'Spring 2024',
          status: 'active',
          teams: { current: 12, max: 16, disputes: 3 },
          matches: { played: 28, total: 50 },
          prizePool: 10000,
          paidPercentage: 50,
          startDate: '2024-01-20',
          endDate: '2024-01-30',
          duration: 10,
          featured: false,
          issues: 2
        }
      ];
      
      setTournaments(mockTournaments);
      setError(null);
    } catch (error) {
      console.error(error);
      setError('Failed to load tournaments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickFilter = (filter) => {
    setQuickFilter(filter);
  };

  const handleSelectTournament = (id) => {
    setSelectedTournaments(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTournaments.length === tournaments.length) {
      setSelectedTournaments([]);
    } else {
      setSelectedTournaments(tournaments.map(t => t.id));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      live: { icon: '🔴', text: 'LIVE', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
      upcoming: { icon: '⏳', text: 'Sắp diễn ra', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
      completed: { icon: '✅', text: 'Hoàn thành', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
      draft: { icon: '🔧', text: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
      active: { icon: '🟢', text: 'Đang diễn ra', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
      cancelled: { icon: '❌', text: 'Đã hủy', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' }
    };
    
    const badge = badges[status] || badges.draft;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const handleDeleteTournament = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa giải đấu này?")) {
      console.log("Xóa giải đấu", id);
      setTournaments((prev) => prev.filter((t) => t.id !== id));
      setOpenMenuId(null);
    }
  };

  // Load danh sách team khi mở modal
  const loadTeams = async () => {
    const { teams } = await mockTeamService.getAllTeams();
    setAvailableTeams(teams);
  };

  const handleCreateRanking = async (id) => {
    setSelectedTournamentId(id);
    setShowRankingModal(true);
    await loadTeams();
    setRankingTeams([]); // reset khi mở modal
  };

  const handleAddTeam = (team) => {
    if (!rankingTeams.find((t) => t.id === team.id)) {
      setRankingTeams((prev) => [
        ...prev,
        { ...team, wins: 0, losses: 0, points: 0 },
      ]);
    }
  };

  const handleRemoveTeam = (teamId) => {
    setRankingTeams((prev) => prev.filter((t) => t.id !== teamId));
  };

  const handleSaveLeaderboard1 = async () => {
    setSaving(true);

    // Giả lập delay 1s
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const updated = {
      ...leaderboardsByTournament,
      [selectedTournamentId]: {
        status: tournamentStatus,
        teams: rankingTeams.map((t) => ({
          id: t.id,
          name: t.name,
          logo: t.logo,
          wins: 0,
          losses: 0,
          points: 0,
        })),
      },
    };

    // Lưu ra state + localStorage
    setLeaderboardsByTournament(updated);
    saveLeaderboardData(updated);

    // ✅ Tắt loading + đóng modal
    setSaving(false);
    setShowRankingModal(false);

    alert(`✅ Đã lưu bảng xếp hạng cho giải ${selectedTournamentId}`);
  };

  // Mở modal xem bảng xếp hạng
  const handleViewRanking = (tournamentId) => {
    setSelectedLeaderboardId(tournamentId);
    setShowLeaderboardModal(true);
    setSavingLeaderboard(false);

    const lb = leaderboardsByTournament[tournamentId];
    if (lb) {
      setLeaderboard(lb.teams);
      setStatusEditing(lb.status);
    } else {
      // Nếu chưa có, khởi tạo rỗng
      setLeaderboard([]);
      setStatusEditing('upcoming');
    }
  };

  // Sửa giá trị từng hàng
  const handleChangeField = (id, field, value) => {
    setLeaderboard((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: parseInt(value) || 0 } : item
      )
    );
  };

  // Lưu mock thay đổi
  const handleSaveLeaderboard = async () => {
    setSavingLeaderboard(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const updated = {
      ...leaderboardsByTournament,
      [selectedLeaderboardId]: {
        status: statusEditing,
        teams: leaderboard,
      },
    };

    setLeaderboardsByTournament(updated);
    saveLeaderboardData(updated);

    setSavingLeaderboard(false);
    setShowLeaderboardModal(false);

    alert(`✅ Đã cập nhật bảng xếp hạng giải ${selectedLeaderboardId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Quản lý Giải đấu
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Quản lý tất cả giải đấu esports
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">
              ⬆️ Import
            </button>
            <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">
              ⬇️ Export
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              ➕ Tạo Giải đấu
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <span className="text-red-600 dark:text-red-400 text-xl">⚠️</span>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Lỗi tải dữ liệu
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.total}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  +5 tháng này
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Đang diễn ra</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.active}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Live ngay bây giờ
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sắp diễn ra</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.upcoming}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  30 ngày tới
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.completed}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Mùa giải này
                </p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tổng đội</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalTeams.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Đã đăng ký</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tổng trận</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalMatches.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Đã diễn ra</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Giải thưởng</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${(stats.totalPrizePool / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Đã phân phối</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vấn đề</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {stats.issues}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Cần xử lý</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="🔍 Tìm kiếm giải đấu..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 font-medium"
              >
                🔽 Bộ lọc
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <select
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={filters.game}
                  onChange={(e) => handleFilterChange('game', e.target.value)}
                >
                  <option value="">Tất cả Game</option>
                  <option value="lol">League of Legends</option>
                  <option value="cs2">Counter-Strike 2</option>
                  <option value="dota2">Dota 2</option>
                  <option value="valorant">Valorant</option>
                </select>

                <select
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={filters.season}
                  onChange={(e) => handleFilterChange('season', e.target.value)}
                >
                  <option value="">Tất cả Mùa giải</option>
                  <option value="spring-2024">Spring 2024</option>
                  <option value="summer-2024">Summer 2024</option>
                  <option value="fall-2024">Fall 2024</option>
                  <option value="winter-2024">Winter 2024</option>
                </select>

                <select
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">Tất cả Trạng thái</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={filters.format}
                  onChange={(e) => handleFilterChange('format', e.target.value)}
                >
                  <option value="">Tất cả Format</option>
                  <option value="single-elim">Single Elimination</option>
                  <option value="double-elim">Double Elimination</option>
                  <option value="round-robin">Round Robin</option>
                  <option value="swiss">Swiss</option>
                </select>
              </div>
            )}

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'Tất cả', color: 'blue' },
                { id: 'live', label: '🔴 Live', color: 'green' },
                { id: 'upcoming', label: '⏳ Sắp diễn ra', color: 'yellow' },
                { id: 'completed', label: '✅ Hoàn thành', color: 'gray' },
                { id: 'cancelled', label: '❌ Đã hủy', color: 'red' },
                { id: 'issues', label: '⚠️ Có vấn đề', color: 'orange' },
                { id: 'draft', label: '🔧 Draft', color: 'purple' },
                { id: 'pending', label: '✏️ Chờ duyệt', color: 'indigo' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => handleQuickFilter(filter.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    quickFilter === filter.id
                      ? `bg-${filter.color}-600 text-white`
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tournament Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Table Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedTournaments.length === tournaments.length && tournaments.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedTournaments.length > 0 && `${selectedTournaments.length} đã chọn`}
              </span>
              {selectedTournaments.length > 0 && (
                <select className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option>Bulk Actions</option>
                  <option>Bulk Edit</option>
                  <option>Export Selected</option>
                  <option>Send Announcement</option>
                  <option>Suspend All</option>
                  <option>Delete All</option>
                </select>
              )}
            </div>
            <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              ⚙️ Cột
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Đang tải...</p>
            </div>
          )}

          {/* Tournament List */}
          {!loading && tournaments.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      <input type="checkbox" className="w-4 h-4 rounded" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Giải đấu
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Game
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Mùa giải
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Đội/Trận
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Giải thưởng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Thời gian
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {tournaments.map(tournament => (
                    <tr key={tournament.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTournaments.includes(tournament.id)}
                          onChange={() => handleSelectTournament(tournament.id)}
                          className="w-4 h-4 rounded"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {tournament.name}
                          </div>
                          {tournament.featured && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded">
                              Nổi bật
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {tournament.game}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {tournament.season}
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(tournament.status)}
                        {tournament.status === 'live' && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Ngày {tournament.duration}
                          </div>
                        )}
                        {tournament.status === 'upcoming' && tournament.daysUntil && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Còn {tournament.daysUntil} ngày
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <div className="text-gray-900 dark:text-white">
                            {tournament.teams.current}/{tournament.teams.max} đội
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {tournament.matches.played} trận
                          </div>
                          {tournament.teams.pending && (
                            <div className="text-yellow-600 dark:text-yellow-400 text-xs">
                              {tournament.teams.pending} chờ duyệt
                            </div>
                          )}
                          {tournament.teams.disputes && (
                            <div className="text-red-600 dark:text-red-400 text-xs">
                              ⚠️ {tournament.teams.disputes} tranh chấp
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <div className="text-gray-900 dark:text-white font-medium">
                            ${tournament.prizePool.toLocaleString()}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {tournament.paidPercentage}% đã trả
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {tournament.startDate && (
                          <div>
                            <div>{tournament.startDate}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {tournament.duration} ngày
                            </div>
                          </div>
                        )}
                        {!tournament.startDate && <span className="text-gray-400">TBD</span>}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === tournament.id ? null : tournament.id)}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xl px-2"
                          >
                            ⋮
                          </button>

                          {openMenuId === tournament.id && (
                            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                              <button
                                onClick={() => handleViewRanking(tournament.id)}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                              >
                                👁️ Xem bảng xếp hạng
                              </button>
                              <button
                                onClick={() => handleCreateRanking(tournament.id)}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border-t border-gray-200 dark:border-gray-700"
                              >
                                🧩 Tạo bảng xếp hạng
                              </button>
                              <button
                                onClick={() => handleDeleteTournament(tournament.id)}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-red-100 dark:hover:bg-red-700 text-red-600 dark:text-red-300 border-t border-gray-200 dark:border-gray-700"
                              >
                                🗑️ Xóa giải đấu
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!loading && tournaments.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Không tìm thấy giải đấu
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Không có giải đấu nào phù hợp với bộ lọc của bạn
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Tạo giải đấu đầu tiên
              </button>
            </div>
          )}

          {/* Pagination */}
          {!loading && tournaments.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Hiển thị 1-{tournaments.length} của {tournaments.length} giải đấu
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50" disabled>
                  ← Trước
                </button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                  1
                </button>
                <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  2
                </button>
                <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  3
                </button>
                <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create Tournament Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Tạo Giải đấu Mới
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6">
                <form className="space-y-6">
                  {/* Step 1: Basic Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Bước 1: Thông tin cơ bản
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tên giải đấu *
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          placeholder="VD: Spring Championship 2024"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Game *
                          </label>
                          <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="">Chọn game</option>
                            <option value="lol">League of Legends</option>
                            <option value="cs2">Counter-Strike 2</option>
                            <option value="dota2">Dota 2</option>
                            <option value="valorant">Valorant</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Mùa giải *
                          </label>
                          <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="">Chọn mùa giải</option>
                            <option value="spring-2024">Spring 2024</option>
                            <option value="summer-2024">Summer 2024</option>
                            <option value="fall-2024">Fall 2024</option>
                            <option value="winter-2024">Winter 2024</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Mô tả
                        </label>
                        <textarea
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          placeholder="Mô tả về giải đấu..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Logo giải đấu
                        </label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                          <div className="text-4xl mb-2">📤</div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Kéo thả hoặc click để upload
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            PNG, JPG (khuyến nghị: 512x512px)
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm">
                            Official
                          </button>
                          <button type="button" className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-sm">
                            Featured
                          </button>
                          <button type="button" className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-sm">
                            Amateur
                          </button>
                          <button type="button" className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-sm">
                            + Thêm tag
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Tournament Details */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Bước 2: Chi tiết giải đấu
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Thể thức *
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="format" value="single" className="w-4 h-4" />
                            <span className="text-gray-700 dark:text-gray-300">Single Elimination</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="format" value="double" className="w-4 h-4" defaultChecked />
                            <span className="text-gray-700 dark:text-gray-300">Double Elimination</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="format" value="round-robin" className="w-4 h-4" />
                            <span className="text-gray-700 dark:text-gray-300">Round Robin</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="format" value="swiss" className="w-4 h-4" />
                            <span className="text-gray-700 dark:text-gray-300">Swiss System</span>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Số đội *
                          </label>
                          <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="8">8 đội</option>
                            <option value="16">16 đội</option>
                            <option value="32">32 đội</option>
                            <option value="64">64 đội</option>
                            <option value="custom">Tùy chỉnh</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Khu vực
                          </label>
                          <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="global">Toàn cầu</option>
                            <option value="asia">Châu Á</option>
                            <option value="europe">Châu Âu</option>
                            <option value="americas">Châu Mỹ</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Địa điểm
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="venue" value="online" className="w-4 h-4" defaultChecked />
                            <span className="text-gray-700 dark:text-gray-300">Online</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="venue" value="offline" className="w-4 h-4" />
                            <span className="text-gray-700 dark:text-gray-300">Offline</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="venue" value="hybrid" className="w-4 h-4" />
                            <span className="text-gray-700 dark:text-gray-300">Hybrid</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Prize Pool */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Bước 3: Giải thưởng
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tổng giải thưởng (USD) *
                        </label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          placeholder="50000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phân phối giải thưởng
                        </label>
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <input type="text" placeholder="🥇 1st" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            <input type="number" placeholder="$20,000" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            <input type="number" placeholder="40%" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <input type="text" placeholder="🥈 2nd" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            <input type="number" placeholder="$12,000" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            <input type="number" placeholder="24%" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                          </div>
                          <button type="button" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            + Thêm hạng
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                    >
                      Lưu nháp
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                    >
                      Xuất bản →
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      {showRankingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                🧩 Tạo bảng xếp hạng
              </h2>
              <button
                onClick={() => setShowRankingModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thêm đội tuyển
                </label>
                <div className="flex gap-2 flex-wrap">
                  {availableTeams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => handleAddTeam(team)}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-700"
                    >
                      ➕ {team.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Danh sách đội đã chọn ({rankingTeams.length})
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                  {rankingTeams.length === 0 && (
                    <div className="text-gray-500 text-sm p-3">
                      Chưa có đội nào được thêm.
                    </div>
                  )}
                  {rankingTeams.map((team) => (
                    <div
                      key={team.id}
                      className="flex justify-between items-center p-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {team.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveTeam(team.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ❌ Xóa
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trạng thái giải đấu
                </label>
                <select
                  value={tournamentStatus}
                  onChange={(e) => setTournamentStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="upcoming">⏳ Chưa diễn ra</option>
                  <option value="live">🟢 Đang diễn ra</option>
                  <option value="completed">✅ Đã xong</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  onClick={() => setShowRankingModal(false)}
                  className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveLeaderboard1}
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : '💾 Lưu bảng xếp hạng'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLeaderboardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                👁️ Bảng xếp hạng Giải {selectedLeaderboardId}
              </h2>
              <button
                onClick={() => setShowLeaderboardModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Trạng thái giải đấu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trạng thái giải đấu
                </label>
                <select
                  value={statusEditing}
                  onChange={(e) => setStatusEditing(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="upcoming">⏳ Chưa diễn ra</option>
                  <option value="live">🟢 Đang diễn ra</option>
                  <option value="completed">✅ Đã hoàn thành</option>
                </select>
              </div>

              {/* Bảng đội */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-100 dark:bg-gray-700/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">#</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Đội</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Thắng</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Thua</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Điểm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {leaderboard.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-6 text-gray-500 dark:text-gray-400">
                          Không có dữ liệu bảng xếp hạng
                        </td>
                      </tr>
                    )}
                    {leaderboard.map((team, index) => (
                      <tr key={team.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{index + 1}</td>
                        <td className="px-4 py-3 flex items-center gap-3">
                          <img
                            src={team.logo || '/default-team.png'}
                            className="w-8 h-8 rounded-full object-cover"
                            alt={team.name || team.team || 'team'}
                          />
                          <span className="text-gray-900 dark:text-white font-medium">
                            {team.name || team.team || 'Không rõ tên'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={team.wins ?? 0}
                            onChange={(e) => handleChangeField(team.id, 'wins', e.target.value)}
                            className="w-16 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={team.losses || 0}
                            onChange={(e) => handleChangeField(team.id, 'losses', e.target.value)}
                            className="w-16 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={team.points || 0}
                            onChange={(e) => handleChangeField(team.id, 'points', e.target.value)}
                            className="w-20 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Nút lưu */}
              <div className="flex justify-end border-t border-gray-200 dark:border-gray-700 pt-4 gap-3">
                <button
                  onClick={() => setShowLeaderboardModal(false)}
                  className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveLeaderboard}
                  disabled={savingLeaderboard}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {savingLeaderboard ? 'Đang lưu...' : '💾 Lưu bảng xếp hạng'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};