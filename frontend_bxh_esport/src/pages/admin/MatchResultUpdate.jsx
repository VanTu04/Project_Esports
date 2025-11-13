import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tournamentService from '../../services/tournamentService';
import matchService from '../../services/matchService';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import Button from '../../components/common/Button';
import { useNotification } from '../../context/NotificationContext';
import { ArrowLeftIcon, EllipsisVerticalIcon, CalendarIcon, TrophyIcon, UsersIcon } from '@heroicons/react/24/outline';
import { TournamentBracket } from '../../components/tournament/TournamentBracket';

// Fake data for demo
const FAKE_TOURNAMENT = {
  id: 1,
  name: 'VCS Mùa Xuân 2024',
  description: 'Giải đấu LMHT chuyên nghiệp Việt Nam',
  game_name: 'League of Legends',
  status: 'ACTIVE',
  current_round: 2,
  total_rounds: 5,
  start_date: '2024-01-15',
  end_date: '2024-03-30',
  prize_pool: 500000000,
  max_teams: 8,
  format: 'Single Elimination',
  location: 'TP. Hồ Chí Minh',
  organizer: 'Riot Games Vietnam',
  teams: { total: 8, approved: 8, pending: 0 },
  matches: { total: 28, completed: 10, pending: 18 }
};

// Fake schedule for demo
const FAKE_SCHEDULE = [
  {
    id: 1,
    date: '2024-01-15',
    day: 'Thứ 2',
    matches: [
      { id: 1, time: '14:00', team1: 'Saigon Buffalo', team2: 'GAM Esports', round: 1, status: 'COMPLETED' },
      { id: 2, time: '16:00', team1: 'Team Flash', team2: 'Vikings Esports', round: 1, status: 'COMPLETED' },
    ]
  },
  {
    id: 2,
    date: '2024-01-16',
    day: 'Thứ 3',
    matches: [
      { id: 3, time: '14:00', team1: 'Team Secret', team2: 'Cerberus Esports', round: 1, status: 'COMPLETED' },
      { id: 4, time: '16:00', team1: 'Box Gaming', team2: 'Luxury Esports', round: 1, status: 'COMPLETED' },
    ]
  },
  {
    id: 3,
    date: '2024-01-20',
    day: 'Thứ 7',
    matches: [
      { id: 5, time: '14:00', team1: 'Saigon Buffalo', team2: 'Team Flash', round: 2, status: 'LIVE' },
      { id: 6, time: '16:00', team1: 'Vikings Esports', team2: 'Team Secret', round: 2, status: 'PENDING' },
    ]
  },
  {
    id: 4,
    date: '2024-01-21',
    day: 'Chủ nhật',
    matches: [
      { id: 7, time: '14:00', team1: 'Cerberus Esports', team2: 'Box Gaming', round: 2, status: 'PENDING' },
      { id: 8, time: '16:00', team1: 'Luxury Esports', team2: 'GAM Esports', round: 2, status: 'PENDING' },
    ]
  },
];

const FAKE_MATCHES = [
  // Round 1
  {
    id: 1,
    round_number: 1,
    match_order: 1,
    team1_id: 1,
    team2_id: 2,
    Team1: { id: 1, name: 'Saigon Buffalo', logo: null },
    Team2: { id: 2, name: 'GAM Esports', logo: null },
    score1: 2,
    score2: 1,
    status: 'COMPLETED',
    winner_id: 1,
    scheduled_time: '2024-01-15T14:00:00Z'
  },
  {
    id: 2,
    round_number: 1,
    match_order: 2,
    team1_id: 3,
    team2_id: 4,
    Team1: { id: 3, name: 'Team Flash', logo: null },
    Team2: { id: 4, name: 'Vikings Esports', logo: null },
    score1: 1,
    score2: 2,
    status: 'COMPLETED',
    winner_id: 4,
    scheduled_time: '2024-01-15T16:00:00Z'
  },
  {
    id: 3,
    round_number: 1,
    match_order: 3,
    team1_id: 5,
    team2_id: 6,
    Team1: { id: 5, name: 'Team Secret', logo: null },
    Team2: { id: 6, name: 'Cerberus Esports', logo: null },
    score1: 2,
    score2: 0,
    status: 'COMPLETED',
    winner_id: 5,
    scheduled_time: '2024-01-16T14:00:00Z'
  },
  {
    id: 4,
    round_number: 1,
    match_order: 4,
    team1_id: 7,
    team2_id: 8,
    Team1: { id: 7, name: 'Box Gaming', logo: null },
    Team2: { id: 8, name: 'Luxury Esports', logo: null },
    score1: 0,
    score2: 2,
    status: 'COMPLETED',
    winner_id: 8,
    scheduled_time: '2024-01-16T16:00:00Z'
  },
  // Round 2
  {
    id: 5,
    round_number: 2,
    match_order: 1,
    team1_id: 1,
    team2_id: 3,
    Team1: { id: 1, name: 'Saigon Buffalo', logo: null },
    Team2: { id: 3, name: 'Team Flash', logo: null },
    score1: 1,
    score2: 1,
    status: 'LIVE',
    winner_id: null,
    scheduled_time: '2024-01-20T14:00:00Z'
  },
  {
    id: 6,
    round_number: 2,
    match_order: 2,
    team1_id: 4,
    team2_id: 5,
    Team1: { id: 4, name: 'Vikings Esports', logo: null },
    Team2: { id: 5, name: 'Team Secret', logo: null },
    score1: null,
    score2: null,
    status: 'PENDING',
    winner_id: null,
    scheduled_time: '2024-01-20T16:00:00Z'
  },
  {
    id: 7,
    round_number: 2,
    match_order: 3,
    team1_id: 6,
    team2_id: 7,
    Team1: { id: 6, name: 'Cerberus Esports', logo: null },
    Team2: { id: 7, name: 'Box Gaming', logo: null },
    score1: null,
    score2: null,
    status: 'PENDING',
    winner_id: null,
    scheduled_time: '2024-01-21T14:00:00Z'
  },
  {
    id: 8,
    round_number: 2,
    match_order: 4,
    team1_id: 8,
    team2_id: 2,
    Team1: { id: 8, name: 'Luxury Esports', logo: null },
    Team2: { id: 2, name: 'GAM Esports', logo: null },
    score1: null,
    score2: null,
    status: 'PENDING',
    winner_id: null,
    scheduled_time: '2024-01-21T16:00:00Z'
  },
  // Round 3
  {
    id: 9,
    round_number: 3,
    match_order: 1,
    team1_id: 1,
    team2_id: 4,
    Team1: { id: 1, name: 'Saigon Buffalo', logo: null },
    Team2: { id: 4, name: 'Vikings Esports', logo: null },
    score1: null,
    score2: null,
    status: 'PENDING',
    winner_id: null,
    scheduled_time: '2024-01-25T14:00:00Z'
  },
  {
    id: 10,
    round_number: 3,
    match_order: 2,
    team1_id: 5,
    team2_id: 8,
    Team1: { id: 5, name: 'Team Secret', logo: null },
    Team2: { id: 8, name: 'Luxury Esports', logo: null },
    score1: null,
    score2: null,
    status: 'PENDING',
    winner_id: null,
    scheduled_time: '2024-01-25T16:00:00Z'
  }
];

export const MatchResultUpdate = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateData, setUpdateData] = useState({
    score1: 0,
    score2: 0,
    status: 'COMPLETED',
    winner_id: null,
  });
  const [viewMode, setViewMode] = useState('list'); // 'list', 'bracket', or 'schedule'
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    if (tournamentId) {
      loadTournamentAndMatches();
    }
  }, [tournamentId]);

  const loadTournamentAndMatches = async () => {
    try {
      setLoading(true);
      
      // USE FAKE DATA FOR DEMO
      setTimeout(() => {
        setTournament(FAKE_TOURNAMENT);
        setMatches(FAKE_MATCHES);
        setSchedule(FAKE_SCHEDULE);
        setLoading(false);
      }, 800);
      
      /* REAL API CODE - Comment out for demo
      // Load tournament info
      const tournamentResponse = await tournamentService.getTournamentById(tournamentId);
      setTournament(tournamentResponse?.data);

      // Load matches
      const matchesResponse = await tournamentService.getTournamentMatches(tournamentId);
      const matchesData = matchesResponse?.data || [];
      
      // Sort by round and match order
      const sortedMatches = matchesData.sort((a, b) => {
        if (a.round_number !== b.round_number) {
          return a.round_number - b.round_number;
        }
        return a.match_order - b.match_order;
      });
      
      setMatches(sortedMatches);
      setLoading(false);
      */
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      showError('Không thể tải danh sách trận đấu!');
      setLoading(false);
    }
  };

  const handleOpenUpdateModal = (match) => {
    setSelectedMatch(match);
    setUpdateData({
      score1: match.score1 || 0,
      score2: match.score2 || 0,
      status: match.status || 'COMPLETED',
      winner_id: match.winner_id || null,
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateMatch = async () => {
    try {
      if (!selectedMatch) return;

      // Determine winner based on scores
      let winnerId = null;
      if (updateData.score1 > updateData.score2) {
        winnerId = selectedMatch.team1_id;
      } else if (updateData.score2 > updateData.score1) {
        winnerId = selectedMatch.team2_id;
      }

      const payload = {
        score1: parseInt(updateData.score1),
        score2: parseInt(updateData.score2),
        status: updateData.status,
        winner_id: winnerId,
      };

      // FAKE UPDATE FOR DEMO
      const updatedMatches = matches.map(m => 
        m.id === selectedMatch.id 
          ? { ...m, ...payload }
          : m
      );
      setMatches(updatedMatches);
      showSuccess('Cập nhật kết quả thành công! (Demo mode)');
      setIsUpdateModalOpen(false);

      /* REAL API CODE - Comment out for demo
      await matchService.updateMatchResult(selectedMatch.id, payload);
      showSuccess('Cập nhật kết quả thành công!');
      setIsUpdateModalOpen(false);
      loadTournamentAndMatches();
      */
    } catch (error) {
      console.error('❌ Failed to update match:', error);
      showError('Không thể cập nhật kết quả trận đấu!');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { text: 'Chưa diễn ra', color: 'bg-gray-500/30 text-gray-300 border border-gray-400/50' },
      LIVE: { text: 'Đang diễn ra', color: 'bg-green-500/30 text-green-300 border border-green-400/50' },
      COMPLETED: { text: 'Hoàn thành', color: 'bg-blue-500/30 text-blue-300 border border-blue-400/50' },
    };
    
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const groupedMatches = matches.reduce((acc, match) => {
    const round = match.round_number || 1;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Đang tải danh sách trận đấu..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-500 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Demo Mode Indicator */}
        <div className="bg-amber-500/20 border-2 border-amber-500/50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-300">
                🎮 DEMO MODE - Dữ liệu mẫu
              </h3>
              <p className="text-xs text-amber-200/80 mt-1">
                Đang sử dụng dữ liệu giả để demo. Cập nhật kết quả sẽ chỉ lưu trên trình duyệt.
              </p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/tournaments')}
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Quản lý Trận đấu
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {tournament?.name || 'Đang tải...'}
              </p>
            </div>
          </div>
        </div>

        {/* Tournament Details */}
        {tournament && (
          <Card padding="lg">
            <div className="space-y-6">
              {/* Tournament Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <TrophyIcon className="w-6 h-6 text-primary-400" />
                    <h2 className="text-2xl font-bold text-white">{tournament.name}</h2>
                  </div>
                  <p className="text-gray-400 mb-4">{tournament.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">🎮 Game</p>
                      <p className="text-sm font-semibold text-white">{tournament.game_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">📍 Địa điểm</p>
                      <p className="text-sm font-semibold text-white">{tournament.location || 'Online'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">🏢 Ban tổ chức</p>
                      <p className="text-sm font-semibold text-white">{tournament.organizer || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">🎯 Format</p>
                      <p className="text-sm font-semibold text-white">{tournament.format || 'Swiss'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-primary-700/20">
                <div className="text-center p-3 bg-primary-500/10 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Vòng hiện tại</p>
                  <p className="text-2xl font-bold text-primary-400">
                    {tournament.current_round || 0} / {tournament.total_rounds || 0}
                  </p>
                </div>
                <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Tổng trận đấu</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {matches.length}
                  </p>
                </div>
                <div className="text-center p-3 bg-green-500/10 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Đã hoàn thành</p>
                  <p className="text-2xl font-bold text-green-400">
                    {matches.filter(m => m.status === 'COMPLETED').length}
                  </p>
                </div>
                <div className="text-center p-3 bg-amber-500/10 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Chờ thi đấu</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {matches.filter(m => m.status === 'PENDING').length}
                  </p>
                </div>
                <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Giải thưởng</p>
                  <p className="text-xl font-bold text-yellow-400">
                    {new Intl.NumberFormat('vi-VN', { 
                      style: 'currency', 
                      currency: 'VND',
                      notation: 'compact',
                      maximumFractionDigits: 0
                    }).format(tournament.prize_pool || 0)}
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center justify-between pt-4 border-t border-primary-700/20">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Bắt đầu</p>
                    <p className="text-sm font-semibold text-white">
                      {new Date(tournament.start_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-1 bg-gradient-to-r from-green-500 via-amber-500 to-gray-600 rounded-full"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Kết thúc</p>
                    <p className="text-sm font-semibold text-white">
                      {new Date(tournament.end_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* View Mode Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg border-2 border-primary-700/30 p-1 bg-dark-400">
            <button
              onClick={() => setViewMode('list')}
              className={`
                px-6 py-2 rounded-md text-sm font-medium transition-all
                ${viewMode === 'list' 
                  ? 'bg-primary-500 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-dark-300'
                }
              `}
            >
              📋 Danh sách
            </button>
            <button
              onClick={() => setViewMode('bracket')}
              className={`
                px-6 py-2 rounded-md text-sm font-medium transition-all
                ${viewMode === 'bracket' 
                  ? 'bg-primary-500 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-dark-300'
                }
              `}
            >
              🌲 Sơ đồ cây
            </button>
            <button
              onClick={() => setViewMode('schedule')}
              className={`
                px-6 py-2 rounded-md text-sm font-medium transition-all
                ${viewMode === 'schedule' 
                  ? 'bg-primary-500 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-dark-300'
                }
              `}
            >
              📅 Lịch thi đấu
            </button>
          </div>
        </div>

        {/* Bracket View */}
        {viewMode === 'bracket' && (
          <Card padding="lg">
            <TournamentBracket 
              matches={matches} 
              onUpdateMatch={handleOpenUpdateModal}
            />
          </Card>
        )}

        {/* Schedule View */}
        {viewMode === 'schedule' && (
          <div className="space-y-4">
            {schedule.map((day) => (
              <Card key={day.id} padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary-500/20 rounded-lg">
                      <CalendarIcon className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {day.day}, {new Date(day.date).toLocaleDateString('vi-VN')}
                      </h3>
                      <p className="text-sm text-gray-400">{day.matches.length} trận đấu</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {day.matches.map((match) => (
                    <div 
                      key={match.id}
                      className="flex items-center justify-between p-4 bg-dark-400/50 rounded-lg border border-primary-700/20 hover:border-primary-500/50 transition-colors"
                    >
                      {/* Time */}
                      <div className="flex items-center space-x-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-lg font-bold text-primary-400">{match.time}</p>
                          <p className="text-xs text-gray-400">Vòng {match.round}</p>
                        </div>

                        {/* Match */}
                        <div className="flex items-center space-x-4 min-w-[400px]">
                          <div className="flex-1 text-right">
                            <p className="text-sm font-semibold text-white">{match.team1}</p>
                          </div>
                          <div className="px-3 py-1 bg-dark-300 rounded text-xs font-bold text-gray-400">
                            VS
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">{match.team2}</p>
                          </div>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center space-x-3">
                        {match.status === 'COMPLETED' && (
                          <span className="px-3 py-1 text-xs font-bold text-green-400 bg-green-500/20 rounded border border-green-500/50">
                            ✓ Kết thúc
                          </span>
                        )}
                        {match.status === 'LIVE' && (
                          <span className="px-3 py-1 text-xs font-bold text-red-400 bg-red-500/20 rounded border border-red-500/50 animate-pulse">
                            🔴 LIVE
                          </span>
                        )}
                        {match.status === 'PENDING' && (
                          <span className="px-3 py-1 text-xs font-bold text-gray-400 bg-gray-500/20 rounded border border-gray-500/50">
                            ⏳ Sắp diễn ra
                          </span>
                        )}
                        
                        {match.status !== 'PENDING' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const fullMatch = matches.find(m => m.id === match.id);
                              if (fullMatch) handleOpenUpdateModal(fullMatch);
                            }}
                          >
                            Cập nhật
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {schedule.length === 0 && (
              <Card padding="lg">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Chưa có lịch thi đấu
                  </h3>
                  <p className="text-gray-400">
                    Lịch thi đấu sẽ được cập nhật sau khi bắt đầu giải
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* List View - Matches by Round with Schedule */}
        {viewMode === 'list' && (
          <div className="space-y-6">
            {Object.keys(groupedMatches).sort((a, b) => a - b).map(round => (
            <Card key={round} padding="lg">
              <h2 className="text-xl font-bold text-white mb-4">
                Vòng {round}
              </h2>
              <div className="space-y-3">
                {groupedMatches[round].map((match, matchIndex) => (
                  <div
                    key={match.id}
                    className="bg-dark-400/50 rounded-lg p-4 border border-primary-700/20 hover:border-primary-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      {/* Schedule Time */}
                      <div className="flex items-center space-x-4 mr-4">
                        {match.scheduled_time && (
                          <div className="text-center min-w-[80px]">
                            <p className="text-sm font-bold text-primary-400">
                              {new Date(match.scheduled_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(match.scheduled_time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Teams */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-white font-semibold">
                              {match.Team1?.name || 'TBD'}
                            </span>
                            {match.status === 'COMPLETED' && match.score1 !== null && (
                              <span className={`text-2xl font-bold ${
                                match.winner_id === match.team1_id 
                                  ? 'text-green-400' 
                                  : 'text-gray-400'
                              }`}>
                                {match.score1}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-white font-semibold">
                              {match.Team2?.name || 'TBD'}
                            </span>
                            {match.status === 'COMPLETED' && match.score2 !== null && (
                              <span className={`text-2xl font-bold ${
                                match.winner_id === match.team2_id 
                                  ? 'text-green-400' 
                                  : 'text-gray-400'
                              }`}>
                                {match.score2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center space-x-3 ml-6">
                        {getStatusBadge(match.status)}
                        
                        {/* Three-dot menu */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === match.id ? null : match.id)}
                            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                          >
                            <EllipsisVerticalIcon className="w-5 h-5 text-gray-400 hover:text-white" />
                          </button>
                          
                          {openMenuId === match.id && (
                            <>
                              {/* Backdrop */}
                              <div 
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              
                              {/* Menu - Hiển thị lên trên nếu là hàng cuối */}
                              <div className={`absolute right-0 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 flex flex-col ${
                                matchIndex === groupedMatches[round].length - 1 ? 'bottom-full mb-2' : 'mt-2'
                              }`}>
                                {match.status !== 'PENDING' && (
                                  <button
                                    onClick={() => {
                                      handleOpenUpdateModal(match);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-primary-500/20 transition-colors first:rounded-t-lg"
                                  >
                                    {match.status === 'COMPLETED' ? '✏️ Chỉnh sửa kết quả' : '⚡ Cập nhật kết quả'}
                                  </button>
                                )}
                                
                                {match.status === 'PENDING' && (
                                  <button
                                    onClick={() => {
                                      // Start match logic
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-green-500/20 transition-colors first:rounded-t-lg"
                                  >
                                    ▶️ Bắt đầu trận đấu
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => {
                                    // View details logic
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-primary-500/20 transition-colors"
                                >
                                  👁️ Xem chi tiết
                                </button>
                                
                                <button
                                  onClick={() => {
                                    // Reschedule logic
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-amber-500/20 transition-colors"
                                >
                                  📅 Đổi lịch thi đấu
                                </button>
                                
                                {match.status === 'PENDING' && (
                                  <button
                                    onClick={() => {
                                      if (window.confirm('Bạn có chắc muốn hủy trận đấu này?')) {
                                        // Cancel match logic
                                        setOpenMenuId(null);
                                      }
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 transition-colors last:rounded-b-lg border-t border-primary-700/30"
                                  >
                                    ❌ Hủy trận đấu
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Match Info */}
                    <div className="mt-3 pt-3 border-t border-primary-700/20">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Trận #{match.match_order}</span>
                        {match.scheduled_time && (
                          <span>
                            {new Date(match.scheduled_time).toLocaleString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}

            {matches.length === 0 && (
              <Card padding="lg">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Chưa có trận đấu
                  </h3>
                  <p className="text-gray-400">
                    Chưa có trận đấu nào được tạo cho giải đấu này
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Update Modal */}
      {isUpdateModalOpen && selectedMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">
                Cập nhật kết quả trận đấu
              </h2>

              <div className="space-y-3">
                {/* Team 1 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {selectedMatch.Team1?.name || 'Team 1'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-2 border border-primary-700/30 rounded-lg bg-dark-400 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={updateData.score1}
                    onChange={(e) => setUpdateData({ ...updateData, score1: e.target.value })}
                  />
                </div>

                {/* Team 2 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {selectedMatch.Team2?.name || 'Team 2'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-2 border border-primary-700/30 rounded-lg bg-dark-400 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={updateData.score2}
                    onChange={(e) => setUpdateData({ ...updateData, score2: e.target.value })}
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Trạng thái
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-primary-700/30 rounded-lg bg-dark-400 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={updateData.status}
                    onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  >
                    <option value="PENDING">Chưa diễn ra</option>
                    <option value="LIVE">Đang diễn ra</option>
                    <option value="COMPLETED">Hoàn thành</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setIsUpdateModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpdateMatch}
                >
                  Lưu kết quả
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
