import { useEffect, useState } from 'react';
import tournamentService from '../../services/tournamentService';
import { getAllGames } from '../../services/gameService';
import CreateTournamentForm from '../../components/tournament/CreateTournamentForm';
import { TournamentTable } from '../../components/tournament/TournamentTable';
import { CreateRankingModal } from '../../components/tournament/CreateRankingModal';
import { TeamApprovalModal } from '../../components/tournament/TeamApprovalModal';
import { LeaderboardModal } from '../../components/tournament/LeaderboardModal';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import Button from '../../components/common/Button';
import { useNotification } from '../../context/NotificationContext';

export const TournamentManagement = () => {
  const { showSuccess, showError, showWarning } = useNotification();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState([]);
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
  const LEADERBOARD_STORAGE_KEY = 'leaderboards_by_tournament_v1';
  
  // Team approval state
  const [showTeamApprovalModal, setShowTeamApprovalModal] = useState(false);
  const [pendingTeams, setPendingTeams] = useState([]);
  const [selectedTournamentForApproval, setSelectedTournamentForApproval] = useState(null);
  const [processingTeamId, setProcessingTeamId] = useState(null);

  const loadLeaderboardData = () => {
    try {
      const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('loadLeaderboardData error', e);
      return {};
    }
  };

  const saveLeaderboardData = (data) => {
    try {
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(data || {}));
    } catch (e) {
      console.warn('saveLeaderboardData error', e);
    }
  };

  const [leaderboardsByTournament, setLeaderboardsByTournament] = useState(() => loadLeaderboardData());
  
  
  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    upcoming: 0,
    completed: 0,
    totalTeams: 0,
    totalMatches: 0,
    totalPrizePool: 0,
    issues: 0
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadTournaments();
    loadGames();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset về trang 1 khi filter thay đổi
  }, [filters.search, quickFilter]);

  const loadGames = async () => {
    try {
      const response = await getAllGames('ACTIVE');
      setGames(response?.data || []);
    } catch (err) {
      console.error('❌ Failed to load games:', err);
      showWarning('Không thể tải danh sách game cho bộ lọc');
    }
  };

  const loadTournaments = async () => {
    try {
      setLoading(true);
      
      // Build query params based on filters
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      
      // Call real API
      const response = await tournamentService.getAllTournaments(params);
      const tournamentsData = response?.data || [];
      
      // Load participants count for each tournament
      const mappedTournaments = await Promise.all(tournamentsData.map(async (tournament) => {
        // Map status: PENDING -> upcoming, ACTIVE -> live, COMPLETED -> completed
        let mappedStatus = 'upcoming';
        if (tournament.status === 'ACTIVE') {
          mappedStatus = 'live';
        } else if (tournament.status === 'COMPLETED') {
          mappedStatus = 'completed';
        } else if (tournament.status === 'PENDING') {
          mappedStatus = 'upcoming';
        }
        
        // Load participants to count pending/approved
        let teamsCount = { current: 0, max: 0, pending: 0, disputes: 0 };
        try {
          const participantsResponse = await tournamentService.getParticipants(tournament.id);
          if (participantsResponse?.code === 0) {
            const participants = participantsResponse.data || [];
            teamsCount.pending = participants.filter(p => p.status === 'PENDING').length;
            teamsCount.current = participants.filter(p => p.status === 'APPROVED').length;
            teamsCount.max = tournament.max_teams || 32;
          }
        } catch (err) {
          console.warn(`Could not load participants for tournament ${tournament.id}`);
        }
        
        return {
          ...tournament,
          tournament_name: tournament.name,
          status: mappedStatus,
          teams: teamsCount,
          matches: tournament.matches || { total: 0, played: 0, remaining: 0 },
        };
      }));

      setTournaments(mappedTournaments);
      calculateStatistics(mappedTournaments);
    } catch (error) {
      console.error('❌ Failed to load tournaments:', error);
      showError('Không thể tải danh sách giải đấu. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Hàm tính toán statistics từ danh sách giải đấu
  const calculateStatistics = (tournamentList) => {
    const stats = {
      total: tournamentList.length,
      active: 0,
      upcoming: 0,
      completed: 0,
      totalTeams: 0,
      totalMatches: 0,
      totalPrizePool: 0,
      issues: 0
    };

    tournamentList.forEach(tournament => {
      // Đếm theo trạng thái
      if (tournament.status === 'active' || tournament.status === 'live') {
        stats.active++;
      } else if (tournament.status === 'upcoming') {
        stats.upcoming++;
      } else if (tournament.status === 'completed') {
        stats.completed++;
      }

      // Tổng số đội
      if (tournament.teams?.current) {
        stats.totalTeams += tournament.teams.current;
      }

      // Tổng số trận
      if (tournament.matches?.played) {
        stats.totalMatches += tournament.matches.played;
      }

      // Tổng giải thưởng
      if (tournament.prizePool) {
        stats.totalPrizePool += tournament.prizePool;
      }

      // Đếm các vấn đề (tranh chấp, chờ duyệt)
      if (tournament.teams?.disputes) {
        stats.issues += tournament.teams.disputes;
      }
      if (tournament.teams?.pending) {
        stats.issues += tournament.teams.pending;
      }
    });

    setStats(stats);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickFilter = (filter) => {
    setQuickFilter(filter);
    setCurrentPage(1); // Reset về trang 1
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
      live: { text: 'Đang diễn ra', color: 'bg-green-500/30 text-green-300 border-2 border-green-400/50' },
      upcoming: { text: 'Sắp diễn ra', color: 'bg-amber-500/30 text-amber-200 border-2 border-amber-400/50' },
      completed: { text: 'Hoàn thành', color: 'bg-blue-500/30 text-blue-200 border-2 border-blue-400/50' },
      active: { text: 'Đang diễn ra', color: 'bg-green-500/30 text-green-300 border-2 border-green-400/50' },
      cancelled: { text: 'Đã hủy', color: 'bg-rose-500/30 text-rose-300 border-2 border-rose-400/50' }
    };
    
    const badge = badges[status] || badges.draft;
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const handleDeleteTournament = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa giải đấu này?")) {
      try {
        await tournamentService.deleteTournament(id);
        showSuccess('Đã xóa giải đấu thành công!');
        loadTournaments();
        setOpenMenuId(null);
      } catch (error) {
        console.error('❌ Failed to delete tournament:', error);
        showError('Không thể xóa giải đấu. Vui lòng thử lại!');
      }
    }
  };

  // Load danh sách team khi mở modal
  // Temporary mock team service (fallback) used by the demo UI. Replace with real API when available.
  const mockTeamService = {
    getAllTeams: async () => {
      return { teams: [] };
    }
  };

  const loadTeams = async () => {
    try {
      const { teams } = await mockTeamService.getAllTeams();
      setAvailableTeams(teams || []);
    } catch (e) {
      console.warn('loadTeams error', e);
      setAvailableTeams([]);
    }
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

  // Mở modal duyệt đội
  const handleOpenTeamApproval = async (tournament) => {
    setSelectedTournamentForApproval(tournament);
    
    try {
      // Load real pending teams from API
      const response = await tournamentService.getParticipants(tournament.id, 'PENDING');
      
      // Backend trả về: {code: 0, data: [], message: string}
      let participants = [];
      
      if (response?.code === 0) {
        participants = response.data || [];
      } else if (Array.isArray(response)) {
        participants = response;
      } else if (response?.data && Array.isArray(response.data)) {
        participants = response.data;
      }
      
      // Map participants to team format
      const teams = participants.map(p => ({
        id: p.id,
        name: p.team_name,
        logo: '�', // Default icon
        captain: p.User?.full_name || 'N/A',
        members: 5, // Default or fetch from team data
        registeredDate: p.created_at,
        description: `Wallet: ${p.wallet_address}`,
      }));
      
      setPendingTeams(teams);
      setShowTeamApprovalModal(true);
    } catch (error) {
      showError('Không thể tải danh sách đội chờ duyệt!');
    }
  };

  // Duyệt đội
  const handleApproveTeam = async (teamId) => {
    setProcessingTeamId(teamId);
    
    try {
      // Call real API to approve
      await tournamentService.reviewJoinRequest(teamId, 'APPROVE');
      
      // Remove team from pending list
      setPendingTeams(prev => prev.filter(t => t.id !== teamId));
      
      // Update tournament pending count
      setTournaments(prev => prev.map(t => {
        if (t.id === selectedTournamentForApproval?.id) {
          return {
            ...t,
            teams: {
              ...t.teams,
              pending: Math.max(0, (t.teams?.pending || 0) - 1),
              current: (t.teams?.current || 0) + 1,
            }
          };
        }
        return t;
      }));
      
      showSuccess('Đã duyệt đội thành công!');
    } catch (error) {
      console.error('❌ Failed to approve team:', error);
      showError('Không thể duyệt đội. Vui lòng thử lại!');
    } finally {
      setProcessingTeamId(null);
    }
  };

  // Từ chối đội
  const handleRejectTeam = async (teamId) => {
    setProcessingTeamId(teamId);
    
    try {
      // Call real API to reject
      await tournamentService.reviewJoinRequest(teamId, 'REJECT');
      
      // Remove team from pending list
      setPendingTeams(prev => prev.filter(t => t.id !== teamId));
      
      // Update tournament pending count
      setTournaments(prev => prev.map(t => {
        if (t.id === selectedTournamentForApproval?.id) {
          return {
            ...t,
            teams: {
              ...t.teams,
              pending: Math.max(0, (t.teams?.pending || 0) - 1),
            }
          };
        }
        return t;
      }));
      
      showWarning('Đã từ chối đội!');
    } catch (error) {
      console.error('❌ Failed to reject team:', error);
      showError('Không thể từ chối đội. Vui lòng thử lại!');
    } finally {
      setProcessingTeamId(null);
    }
  };

  // Bắt đầu giải đấu
  const handleStartTournament = async (tournamentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn bắt đầu giải đấu? Sau khi bắt đầu, các đội chờ duyệt sẽ bị từ chối và vòng 1 sẽ được tạo tự động.')) {
      return;
    }

    try {
      // Call API to start tournament
      const response = await tournamentService.startTournament(tournamentId);
      
      showSuccess(`Giải đấu đã bắt đầu! ${response?.data?.matches_created || 0} trận đấu đã được tạo.`);
      
      // Reload tournaments to get updated status
      loadTournaments();
    } catch (error) {
      console.error('❌ Failed to start tournament:', error);
      showError(error?.response?.data?.message || 'Không thể bắt đầu giải đấu. Vui lòng kiểm tra đủ 2 đội đã được duyệt!');
    }
  };

  // Get filtered tournaments based on quick filter and search
  const getFilteredTournaments = () => {
    let filtered = tournaments;

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => {
        const name = (t.name || t.tournament_name || '').toLowerCase();
        const description = (t.description || '').toLowerCase();
        const id = String(t.id);
        
        return name.includes(searchLower) || 
               description.includes(searchLower) || 
               id.includes(searchLower);
      });
    }

    // Apply quick filter
    switch (quickFilter) {
      case 'live':
        filtered = filtered.filter(t => t.status === 'live' || t.status === 'active');
        break;
      case 'upcoming':
        filtered = filtered.filter(t => t.status === 'upcoming');
        break;
      case 'completed':
        filtered = filtered.filter(t => t.status === 'completed');
        break;
      case 'cancelled':
        filtered = filtered.filter(t => t.status === 'cancelled');
        break;
      case 'all':
      default:
        // No additional filtering needed
        break;
    }

    return filtered;
  };

  // Get paginated tournaments
  const getPaginatedTournaments = () => {
    const filtered = getFilteredTournaments();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Handle page change
  const handlePageChange = (page) => {
    const maxPages = getCurrentTotalPages();
    if (page >= 1 && page <= maxPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const filtered = getFilteredTournaments();
    const calculatedTotalPages = Math.ceil(filtered.length / itemsPerPage);
    
    const pages = [];
    const maxVisiblePages = 5;
    
    if (calculatedTotalPages <= maxVisiblePages) {
      // Show all pages if total is less than max
      for (let i = 1; i <= calculatedTotalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination
      if (currentPage <= 3) {
        // Near start
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(calculatedTotalPages);
      } else if (currentPage >= calculatedTotalPages - 2) {
        // Near end
        pages.push(1);
        pages.push('...');
        for (let i = calculatedTotalPages - 3; i <= calculatedTotalPages; i++) pages.push(i);
      } else {
        // Middle
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(calculatedTotalPages);
      }
    }
    
    return pages;
  };

  // Get current total pages based on filtered data
  const getCurrentTotalPages = () => {
    const filtered = getFilteredTournaments();
    return Math.ceil(filtered.length / itemsPerPage);
  };

  return (
    <div className="min-h-screen bg-dark-500 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Quản lý Giải đấu
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Quản lý tất cả giải đấu esports
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="primary"
              size="md"
              onClick={() => setShowCreateModal(true)}
            >
               Tạo Giải đấu
            </Button>
          </div>
        </div>



        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card hover padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tổng số</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-cyan-500/10 rounded-lg">
                <svg className="w-8 h-8 text-cyan-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card hover padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Đang diễn ra</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.active}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Live ngay bây giờ
                </p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <svg className="w-8 h-8 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>

          <Card hover padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Sắp diễn ra</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.upcoming}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  30 ngày tới
                </p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <svg className="w-8 h-8 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>

          <Card hover padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.completed}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Mùa giải này
                </p>
              </div>
              <div className="p-3 bg-sky-500/10 rounded-lg">
                <svg className="w-8 h-8 text-sky-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>

          <Card hover padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tổng đội</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.totalTeams.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-1">Đã đăng ký</p>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-lg">
                <svg className="w-8 h-8 text-indigo-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card hover padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tổng trận</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.totalMatches.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-1">Đã diễn ra</p>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-lg">
                <svg className="w-8 h-8 text-rose-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>

          <Card hover padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Giải thưởng</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${(stats.totalPrizePool / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-gray-400 mt-1">Đã phân phối</p>
              </div>
              <div className="p-3 bg-gradient-gold/10 rounded-lg">
                <svg className="w-8 h-8 text-[#C89B3C]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>

          <Card hover padding="lg" className="border-orange-500/40 bg-gradient-to-br from-orange-500/5 to-red-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Vấn đề</p>
                <p className="text-2xl font-bold text-orange-400 mt-1">
                  {stats.issues}
                </p>
                <p className="text-xs text-orange-300 mt-1">Cần xử lý ngay</p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-lg ring-2 ring-orange-500/30">
                <svg className="w-8 h-8 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card padding="lg">
          <div className="space-y-4">
            {/* Search */}
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Tìm kiếm giải đấu..."
                  className="w-full px-4 py-2 border border-primary-700/30 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
              >
                Bộ lọc
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-primary-700/20">
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={filters.game}
                  onChange={(e) => handleFilterChange('game', e.target.value)}
                >
                  <option value="">Tất cả Game</option>
                  {games.map((game) => (
                    <option key={game.game_id} value={game.game_name}>
                      {game.game_name}
                    </option>
                  ))}
                </select>

                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">Tất cả Trạng thái</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {/* <select
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={filters.format}
                  onChange={(e) => handleFilterChange('format', e.target.value)}
                >
                  <option value="">Tất cả Format</option>
                  <option value="single-elim">Single Elimination</option>
                  <option value="double-elim">Double Elimination</option>
                  <option value="round-robin">Round Robin</option>
                  <option value="swiss">Swiss</option>
                </select> */}
              </div>
            )}

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'Tất cả', variant: 'primary' },
                { id: 'live', label: 'Đang diễn ra', variant: 'success' },
                { id: 'upcoming', label: 'Sắp diễn ra', variant: 'secondary' },
                { id: 'completed', label: 'Hoàn thành', variant: 'secondary' },
                { id: 'cancelled', label: 'Đã hủy', variant: 'danger' },
              ].map(filter => (
                <Button
                  key={filter.id}
                  size="sm"
                  variant={quickFilter === filter.id ? filter.variant : 'ghost'}
                  onClick={() => handleQuickFilter(filter.id)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Tournament Table */}
        <Card>
          {/* Table Header */}
          <div className="p-4 border-b border-primary-700/20 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedTournaments.length === tournaments.length && tournaments.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-primary-700/30 bg-dark-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-white font-medium">
                {selectedTournaments.length > 0 
                  ? `${selectedTournaments.length} đã chọn` 
                  : `Tổng: ${tournaments.length} giải đấu`}
              </span>
              {selectedTournaments.length > 0 && (
                <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-primary-500">
                  <option> Bulk Actions</option>
                  <option> Chỉnh sửa tất cả</option>
                  <option> Xuất đã chọn</option>
                  <option> Gửi thông báo</option>
                  <option> Tạm dừng tất cả</option>
                  <option> Xóa tất cả</option>
                </select>
              )}
            </div>
            <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Cột
            </button>
          </div>

          {loading && (
            <Loading size="lg" text="Đang tải danh sách giải đấu..." />
          )}

          {!loading && getFilteredTournaments().length > 0 && (
            <TournamentTable
              tournaments={getPaginatedTournaments()}
              onViewRanking={handleViewRanking}
              onCreateRanking={handleCreateRanking}
              onDelete={handleDeleteTournament}
              onOpenTeamApproval={handleOpenTeamApproval}
              onStartTournament={handleStartTournament}
              getStatusBadge={getStatusBadge}
            />
          )}

          {/* Empty State */}
          {!loading && tournaments.length > 0 && getFilteredTournaments().length === 0 && (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-white mb-2">
                Không tìm thấy giải đấu
              </h3>
              <p className="text-gray-400 mb-4">
                Không có giải đấu nào phù hợp với bộ lọc "{quickFilter}"
              </p>
            </div>
          )}

          {/* No tournaments at all */}
          {!loading && tournaments.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-lg font-medium text-white mb-2">
                Không tìm thấy giải đấu
              </h3>
              <p className="text-gray-400 mb-4">
                Không có giải đấu nào phù hợp với bộ lọc của bạn
              </p>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                Tạo giải đấu đầu tiên
              </Button>
            </div>
          )}

          {/* Pagination */}
          {!loading && tournaments.length > 0 && (
            <div className="p-4 border-t border-primary-700/20 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {(() => {
                  const filtered = getFilteredTournaments();
                  const start = (currentPage - 1) * itemsPerPage + 1;
                  const end = Math.min(currentPage * itemsPerPage, filtered.length);
                  return `Hiển thị ${filtered.length > 0 ? start : 0}-${end} của ${filtered.length} giải đấu`;
                })()}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="secondary" 
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  ← Trước
                </Button>
                
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-gray-400">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      size="sm"
                      variant={currentPage === page ? 'primary' : 'ghost'}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  )
                ))}
                
                <Button 
                  size="sm" 
                  variant="secondary"
                  disabled={currentPage === getCurrentTotalPages()}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Sau →
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Create Tournament Modal (uses centralized component) */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-primary-700/20 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Tạo Giải đấu Mới</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white text-2xl transition-colors">×</button>
              </div>
              <div className="p-6">
                <CreateTournamentForm onCreated={(res) => { setShowCreateModal(false); loadTournaments(); }} />
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Create Ranking Modal */}
      <CreateRankingModal
        show={showRankingModal}
        onClose={() => setShowRankingModal(false)}
        tournamentId={selectedTournamentId}
        availableTeams={availableTeams}
        rankingTeams={rankingTeams}
        tournamentStatus={tournamentStatus}
        saving={saving}
        onAddTeam={handleAddTeam}
        onRemoveTeam={handleRemoveTeam}
        onStatusChange={setTournamentStatus}
        onSave={handleSaveLeaderboard1}
      />

      {/* Team Approval Modal */}
      <TeamApprovalModal
        show={showTeamApprovalModal}
        onClose={() => setShowTeamApprovalModal(false)}
        tournament={selectedTournamentForApproval}
        pendingTeams={pendingTeams}
        processingTeamId={processingTeamId}
        onApprove={handleApproveTeam}
        onReject={handleRejectTeam}
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal
        show={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        tournamentId={selectedLeaderboardId}
        leaderboard={leaderboard}
        status={statusEditing}
        saving={savingLeaderboard}
        onStatusChange={setStatusEditing}
        onFieldChange={handleChangeField}
        onSave={handleSaveLeaderboard}
      />
    </div>
  );
};