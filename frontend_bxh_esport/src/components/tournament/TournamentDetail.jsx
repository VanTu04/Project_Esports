import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { Loading } from '../common/Loading';
import Button from '../common/Button';
import { TournamentBracket } from './TournamentBracket';
import { ArrowLeftIcon, CalendarIcon, TrophyIcon, UsersIcon } from '@heroicons/react/24/outline';
import tournamentService from '../../services/tournamentService';
import { useNotification } from '../../context/NotificationContext';

export const TournamentDetail = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('teams'); // teams, matches, bracket
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [tournamentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load tournament info
      const tournamentRes = await tournamentService.getTournamentById(tournamentId);
      setTournament(tournamentRes.data);

      // Load teams (participants)
      try {
        const teamsRes = await tournamentService.getParticipants(tournamentId, 'APPROVED');
        setTeams(teamsRes.data || []);
      } catch (err) {
        console.warn('No teams yet:', err);
        setTeams([]);
      }

      // Load matches
      try {
        const matchesRes = await tournamentService.getTournamentMatches(tournamentId);
        console.log('Matches response:', matchesRes);
        console.log('Matches data:', matchesRes.data);
        setMatches(matchesRes.data || []);
      } catch (err) {
        console.warn('No matches yet:', err);
        setMatches([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Không thể tải dữ liệu giải đấu');
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      eliminated: 'bg-red-500/20 text-red-400 border-red-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      APPROVED: 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    
    const labels = {
      active: 'Đang thi đấu',
      eliminated: 'Bị loại',
      pending: 'Chờ xác nhận',
      APPROVED: 'Đã duyệt'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badges[status] || badges.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getMatchStatusBadge = (status) => {
    const badges = {
      PENDING: { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30', label: 'Chưa diễn ra' },
      LIVE: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'Đang diễn ra' },
      COMPLETED: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', label: 'Đã kết thúc' }
    };

    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
        {badge.label}
      </span>
    );
  };

  const groupMatchesByRound = () => {
    const grouped = {};
    matches.forEach(match => {
      const roundNum = match.round_number || 1;
      if (!grouped[roundNum]) {
        grouped[roundNum] = [];
      }
      grouped[roundNum].push(match);
    });
    return grouped;
  };

  const handleOpenUpdateModal = (match) => {
    setSelectedMatch(match);
    setIsUpdateModalOpen(true);
  };

  const handleCloseUpdateModal = () => {
    setSelectedMatch(null);
    setIsUpdateModalOpen(false);
  };

  const handleUpdateMatch = async (matchId, scoreA, scoreB) => {
    try {
      await tournamentService.updateMatchScore(matchId, scoreA, scoreB);
      showSuccess('Cập nhật kết quả thành công!');
      handleCloseUpdateModal();
      loadData(); // Reload data
    } catch (error) {
      console.error('Error updating match:', error);
      showError('Không thể cập nhật kết quả trận đấu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Đang tải dữ liệu..." />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-300">Không tìm thấy giải đấu</p>
        <Button onClick={() => navigate('/admin/tournaments')} className="mt-4">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const groupedMatches = groupMatchesByRound();

  return (
    <div className="min-h-screen bg-dark-400 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/tournaments')}
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">{tournament.name}</h1>
              <p className="text-gray-300 text-sm">{tournament.game_name || 'Esports'}</p>
            </div>
          </div>
        </div>

        {/* Chi tiết giải đấu */}
        <Card padding="lg">
          <h2 className="text-xl font-bold text-white mb-4">Thông tin giải đấu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-primary-500/10 to-primary-600/5 rounded-lg p-4 border border-primary-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Vòng đấu</span>
                <TrophyIcon className="w-5 h-5 text-cyan-300" />
              </div>
              <p className="text-2xl font-bold text-white">
                {tournament.current_round || 0}/{tournament.total_rounds || 0}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Số đội</span>
                <UsersIcon className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {teams.length}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg p-4 border border-green-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Trận đấu</span>
                <CalendarIcon className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white">{matches.length}</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-lg p-4 border border-yellow-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Trạng thái</span>
                <TrophyIcon className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-lg font-bold text-yellow-400">
                {tournament.status || 'PENDING'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm">
            <div>
              <span className="text-gray-300">Bắt đầu:</span>
              <span className="text-white ml-2 font-medium">
                {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('vi-VN') : 'N/A'}
              </span>
            </div>
            <span className="text-cyan-300">→</span>
            <div>
              <span className="text-gray-300">Kết thúc:</span>
              <span className="text-white ml-2 font-medium">
                {tournament.end_date ? new Date(tournament.end_date).toLocaleDateString('vi-VN') : 'N/A'}
              </span>
            </div>
          </div>
        </Card>

        {/* Tabs Navigation */}
        <div className="border-b border-primary-700/20 bg-gradient-to-r from-primary-500/5 to-purple-500/5">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('teams')}
              className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'teams'
                  ? 'border-cyan-300 text-cyan-300'
                  : 'border-transparent text-gray-300 hover:text-cyan-200 hover:border-cyan-400/50'
              }`}
            >
              Danh sách đội
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'matches'
                  ? 'border-cyan-300 text-cyan-300'
                  : 'border-transparent text-gray-300 hover:text-cyan-200 hover:border-cyan-400/50'
              }`}
            >
              Danh sách trận & Lịch
            </button>
            <button
              onClick={() => setActiveTab('bracket')}
              className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'bracket'
                  ? 'border-cyan-300 text-cyan-300'
                  : 'border-transparent text-gray-300 hover:text-cyan-200 hover:border-cyan-400/50'
              }`}
            >
              Sơ đồ
            </button>
          </div>
        </div>

        {/* Tab Content - Danh sách đội */}
        {activeTab === 'teams' && (
          <Card padding="lg">
            <h2 className="text-xl font-bold text-white mb-4">Danh sách đội tham gia</h2>
            {teams.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-white mb-2">Chưa có đội tham gia</h3>
                <p className="text-gray-400">Chưa có đội nào được duyệt tham gia giải đấu</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-primary-700/20">
                  <thead className="bg-gradient-to-r from-primary-500/10 to-purple-500/10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Hạng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Tên đội</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Wallet</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-700/20">
                    {teams.map((team, index) => (
                      <tr key={team.id} className="hover:bg-primary-500/10 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-white font-bold">#{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center mr-3">
                              <span className="text-cyan-300 font-bold text-sm">{team.team_name?.substring(0, 2).toUpperCase()}</span>
                            </div>
                            <span className="text-white font-medium">{team.team_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {team.wallet_address ? `${team.wallet_address.substring(0, 10)}...` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(team.status || 'APPROVED')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Tab Content - Danh sách trận & Lịch */}
        {activeTab === 'matches' && (
          <div className="space-y-6">
            {Object.keys(groupedMatches).length === 0 ? (
              <Card padding="lg">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-lg font-medium text-white mb-2">Chưa có trận đấu</h3>
                  <p className="text-gray-400">Giải đấu chưa bắt đầu hoặc chưa tạo trận đấu</p>
                </div>
              </Card>
            ) : (
              Object.keys(groupedMatches).sort((a, b) => a - b).map(round => (
                <Card key={round} padding="lg">
                  <h3 className="text-xl font-bold text-white mb-4">Vòng {round}</h3>
                  <div className="space-y-3">
                    {groupedMatches[round].map((match) => (
                      <div
                        key={match.id}
                        className="bg-gradient-to-r from-primary-500/5 to-purple-500/5 rounded-lg p-4 border border-primary-500/30 hover:border-primary-400/60 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          {/* Schedule Time */}
                          <div className="flex items-center space-x-4 mr-4">
                            {match.scheduled_time && (
                              <div className="text-center min-w-[80px] bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-lg p-2 border border-primary-400/30">
                                <p className="text-sm font-bold text-blue-300">
                                  {new Date(match.scheduled_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-xs text-gray-300">
                                  {new Date(match.scheduled_time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Teams */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <span className="text-white font-semibold">{match.teamA?.team_name || 'TBD'}</span>
                                {match.status === 'COMPLETED' && match.score_a !== null && (
                                  <span className={`text-2xl font-bold ${
                                    match.winner_participant_id === match.team_a_participant_id ? 'text-green-400' : 'text-gray-300'
                                  }`}>
                                    {match.score_a}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-white font-semibold">{match.teamB?.team_name || 'TBD'}</span>
                                {match.status === 'COMPLETED' && match.score_b !== null && (
                                  <span className={`text-2xl font-bold ${
                                    match.winner_participant_id === match.team_b_participant_id ? 'text-green-400' : 'text-gray-300'
                                  }`}>
                                    {match.score_b}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status & Action */}
                          <div className="ml-4 flex items-center gap-3">
                            {getMatchStatusBadge(match.status)}
                            {match.status !== 'PENDING' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleOpenUpdateModal(match)}
                              >
                                Cập nhật
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Tab Content - Sơ đồ */}
        {activeTab === 'bracket' && (
          <Card padding="lg">
            <h2 className="text-2xl font-bold text-white mb-4">Sơ đồ cây giải đấu</h2>
            <div className="overflow-x-auto">
              <TournamentBracket 
                matches={matches} 
                tournament={tournament}
                compact={true}
              />
            </div>
          </Card>
        )}
      </div>

      {/* Update Match Result Modal */}
      {isUpdateModalOpen && selectedMatch && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">
                Cập nhật kết quả trận đấu
              </h2>

              <div className="space-y-3">
                {/* Team A */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {selectedMatch.TeamA?.team_name || 'Team A'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    defaultValue={selectedMatch.score_a || 0}
                    className="w-full px-3 py-2 bg-dark-300 border border-primary-700/30 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    id="scoreA"
                  />
                </div>

                {/* Team B */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {selectedMatch.TeamB?.team_name || 'Team B'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    defaultValue={selectedMatch.score_b || 0}
                    className="w-full px-3 py-2 bg-dark-300 border border-primary-700/30 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    id="scoreB"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={handleCloseUpdateModal}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    const scoreA = parseInt(document.getElementById('scoreA').value);
                    const scoreB = parseInt(document.getElementById('scoreB').value);
                    handleUpdateMatch(selectedMatch.id, scoreA, scoreB);
                  }}
                >
                  Cập nhật
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TournamentDetail;
