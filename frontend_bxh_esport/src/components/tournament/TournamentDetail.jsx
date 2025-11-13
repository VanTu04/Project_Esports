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
  const [isUpdateScoreModalOpen, setIsUpdateScoreModalOpen] = useState(false);
  const [isUpdateTimeModalOpen, setIsUpdateTimeModalOpen] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState(null);

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
        
        // Handle multiple response formats
        let matchesData = [];
        if (Array.isArray(matchesRes)) {
          matchesData = matchesRes;
        } else if (matchesRes?.data && Array.isArray(matchesRes.data)) {
          matchesData = matchesRes.data;
        } else if (matchesRes?.code === 0 && Array.isArray(matchesRes.data)) {
          matchesData = matchesRes.data;
        }
        
        console.log('Parsed matches data:', matchesData);
        
        // Debug: Log match details
        matchesData.forEach(match => {
          console.log(`Match ${match.id}:`, {
            status: match.status,
            score_a: match.score_a,
            score_b: match.score_b,
            winner_participant_id: match.winner_participant_id,
            team_a_name: match.team_a_name,
            team_b_name: match.team_b_name
          });
        });
        
        setMatches(matchesData);
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

  const handleOpenScoreModal = (match) => {
    setSelectedMatch(match);
    setSelectedWinnerId(null); // Reset winner selection
    setIsUpdateScoreModalOpen(true);
  };

  const handleOpenTimeModal = (match) => {
    setSelectedMatch(match);
    setIsUpdateTimeModalOpen(true);
  };

  const handleCloseModals = () => {
    setSelectedMatch(null);
    setIsUpdateScoreModalOpen(false);
    setIsUpdateTimeModalOpen(false);
    setSelectedWinnerId(null);
  };

  const handleUpdateScore = async (matchId, scoreA, scoreB) => {
    try {
      // Xác định đội thắng dựa trên điểm
      const winnerId = scoreA > scoreB ? selectedMatch.team_a_participant_id : selectedMatch.team_b_participant_id;
      
      console.log('📊 Updating match result:', { 
        matchId, 
        scoreA, 
        scoreB, 
        winnerId,
        selectedMatch 
      });
      
      // Report match result với winner_participant_id
      const response = await tournamentService.reportMatchResult(matchId, { 
        winner_participant_id: winnerId 
      });
      
      console.log('📊 Response:', response);
      
      // Kiểm tra response code
      if (response?.code === 0) {
        showSuccess(response?.message || 'Cập nhật kết quả thành công!');
        handleCloseModals();
        loadData();
      } else {
        console.error('❌ Response error:', response);
        showError(response?.message || 'Không thể cập nhật kết quả');
      }
    } catch (error) {
      console.error('❌ Error updating score:', error);
      console.error('❌ Error details:', error.response);
      showError(error?.response?.data?.message || error?.message || 'Không thể cập nhật kết quả');
    }
  };

  const handleUpdateTime = async (matchId, scheduledTime) => {
    try {
      console.log('⏰ Updating match schedule:', { 
        matchId, 
        scheduledTime,
        isoTime: new Date(scheduledTime).toISOString()
      });

      const response = await tournamentService.updateMatchSchedule(matchId, { 
        match_time: new Date(scheduledTime).toISOString() 
      });
      
      console.log('⏰ Response:', response);
      
      // Kiểm tra response code
      if (response?.code === 0) {
        showSuccess('Cập nhật thời gian thành công!');
        handleCloseModals();
        loadData();
      } else {
        console.error('❌ Response error:', response);
        showError(response?.message || 'Không thể cập nhật thời gian');
      }
    } catch (error) {
      console.error('❌ Error updating time:', error);
      console.error('❌ Error details:', error.response);
      showError(error?.response?.data?.message || error?.message || 'Không thể cập nhật thời gian');
    }
  };

  const handleStartNewRound = async () => {
    try {
      console.log('🎯 Starting new round for tournament:', tournamentId);
      
      const response = await tournamentService.startTournament(tournamentId);
      
      console.log('🎯 Response:', response);
      
      if (response?.code === 0) {
        showSuccess(response?.message || 'Tạo vòng mới thành công!');
        loadData();
      } else {
        showError(response?.message || 'Không thể tạo vòng mới');
      }
    } catch (error) {
      console.error('❌ Error starting new round:', error);
      showError(error?.response?.data?.message || error?.message || 'Không thể tạo vòng mới');
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
            {/* Button Tạo Vòng Mới */}
            <Card padding="lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Quản lý vòng đấu</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {Object.keys(groupedMatches).length > 0 
                      ? `Hiện có ${Object.keys(groupedMatches).length} vòng đấu`
                      : 'Chưa có vòng đấu nào'}
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleStartNewRound}
                  disabled={tournament?.status === 'COMPLETED'}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {Object.keys(groupedMatches).length === 0 ? 'Bắt đầu Vòng 1' : 'Tạo Vòng Mới'}
                </Button>
              </div>
            </Card>

            {Object.keys(groupedMatches).length === 0 ? (
              <Card padding="lg">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-lg font-medium text-white mb-2">Chưa có trận đấu</h3>
                  <p className="text-gray-400">Nhấn nút "Bắt đầu Vòng 1" để tạo vòng đấu đầu tiên</p>
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
                        {/* Schedule Time */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              {match.scheduled_time 
                                ? new Date(match.scheduled_time).toLocaleString('vi-VN', { 
                                    day: '2-digit', 
                                    month: '2-digit', 
                                    year: 'numeric',
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })
                                : 'Chưa có lịch thi đấu'}
                            </span>
                          </div>
                          {getMatchStatusBadge(match.status)}
                        </div>

                        {/* Teams VS Format */}
                        <div className="flex items-center justify-center gap-4 mb-3">
                          <div className="flex-1 text-right">
                            <div className={`text-lg font-bold ${
                              match.status === 'COMPLETED' && match.winner_participant_id === match.team_a_participant_id 
                                ? 'text-green-400' 
                                : 'text-white'
                            }`}>
                              {match.team_a_name || 'TBD'}
                              {match.status === 'COMPLETED' && match.winner_participant_id === match.team_a_participant_id && (
                                <span className="ml-2 text-yellow-400">👑</span>
                              )}
                            </div>
                            {match.status === 'COMPLETED' && (
                              <div className={`text-3xl font-bold mt-1 ${
                                match.winner_participant_id === match.team_a_participant_id 
                                  ? 'text-green-400' 
                                  : 'text-gray-500'
                              }`}>
                                {match.score_a ?? 0}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-center">
                            <div className="text-2xl font-bold text-cyan-300 px-4">VS</div>
                            {match.status === 'COMPLETED' && (
                              <div className="text-xs text-gray-400 mt-1">Kết thúc</div>
                            )}
                          </div>

                          <div className="flex-1 text-left">
                            <div className={`text-lg font-bold ${
                              match.status === 'COMPLETED' && match.winner_participant_id === match.team_b_participant_id 
                                ? 'text-green-400' 
                                : 'text-white'
                            }`}>
                              {match.team_b_name || 'TBD'}
                              {match.status === 'COMPLETED' && match.winner_participant_id === match.team_b_participant_id && (
                                <span className="ml-2 text-yellow-400">👑</span>
                              )}
                            </div>
                            {match.status === 'COMPLETED' && (
                              <div className={`text-3xl font-bold mt-1 ${
                                match.winner_participant_id === match.team_b_participant_id 
                                  ? 'text-green-400' 
                                  : 'text-gray-500'
                              }`}>
                                {match.score_b ?? 0}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center gap-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenTimeModal(match)}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Cập nhật thời gian
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenScoreModal(match)}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Cập nhật tỷ số
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

      </div>

      {/* Update Time Modal */}
      {isUpdateTimeModalOpen && selectedMatch && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">
                <svg className="w-6 h-6 inline mr-2 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cập nhật thời gian thi đấu
              </h2>

              {/* Match Info */}
              <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-lg p-3 border border-primary-500/30 text-center">
                <span className="text-white font-semibold">
                  {selectedMatch.team_a_name || 'TBD'} VS {selectedMatch.team_b_name || 'TBD'}
                </span>
              </div>

              {/* Scheduled Time */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Chọn ngày & giờ thi đấu
                </label>
                <input
                  type="datetime-local"
                  defaultValue={selectedMatch.scheduled_time ? new Date(selectedMatch.scheduled_time).toISOString().slice(0, 16) : ''}
                  className="w-full px-3 py-2 bg-white border border-primary-700/30 rounded-lg text-gray-900 focus:outline-none focus:border-primary-500"
                  id="scheduledTime"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={handleCloseModals}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    const scheduledTime = document.getElementById('scheduledTime').value;
                    console.log('🔍 Debug:', {
                      selectedMatch,
                      matchId: selectedMatch.id,
                      scheduledTime,
                      hasValue: !!scheduledTime
                    });
                    
                    if (!scheduledTime) {
                      showError('Vui lòng chọn thời gian');
                      return;
                    }
                    
                    if (!selectedMatch?.id) {
                      showError('Không tìm thấy ID trận đấu');
                      return;
                    }
                    
                    handleUpdateTime(selectedMatch.id, scheduledTime);
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Cập nhật
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Update Score Modal */}
      {isUpdateScoreModalOpen && selectedMatch && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">
                <svg className="w-6 h-6 inline mr-2 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Chọn đội thắng cuộc
              </h2>

              {/* Match Info */}
              <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-lg p-3 border border-primary-500/30 text-center">
                <div className="text-gray-300 text-xs mb-2">Đội thắng: +2 điểm | Đội thua: +1 điểm</div>
              </div>

              {/* Winner Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Chọn đội chiến thắng:
                </label>
                
                {/* Team A Button */}
                <button
                  onClick={() => setSelectedWinnerId(selectedMatch.team_a_participant_id)}
                  className={`w-full p-4 border-2 rounded-lg transition-all text-left group ${
                    selectedWinnerId === selectedMatch.team_a_participant_id
                      ? 'bg-gradient-to-r from-green-500/30 to-green-600/20 border-green-400 shadow-lg shadow-green-500/20'
                      : 'bg-gradient-to-r from-green-500/10 to-green-600/5 border-green-500/30 hover:border-green-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-bold text-lg">{selectedMatch.team_a_name || 'Team A'}</div>
                      <div className="text-green-400 text-sm mt-1">
                        {selectedWinnerId === selectedMatch.team_a_participant_id ? '✅ ' : ''}
                        👑 Thắng +2 điểm
                      </div>
                    </div>
                    <div className={`text-4xl transition-transform ${
                      selectedWinnerId === selectedMatch.team_a_participant_id ? 'scale-110' : 'group-hover:scale-110'
                    }`}>
                      {selectedWinnerId === selectedMatch.team_a_participant_id ? '🏆' : '🎯'}
                    </div>
                  </div>
                </button>

                {/* Team B Button */}
                <button
                  onClick={() => setSelectedWinnerId(selectedMatch.team_b_participant_id)}
                  className={`w-full p-4 border-2 rounded-lg transition-all text-left group ${
                    selectedWinnerId === selectedMatch.team_b_participant_id
                      ? 'bg-gradient-to-r from-green-500/30 to-green-600/20 border-green-400 shadow-lg shadow-green-500/20'
                      : 'bg-gradient-to-r from-green-500/10 to-green-600/5 border-green-500/30 hover:border-green-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-bold text-lg">{selectedMatch.team_b_name || 'Team B'}</div>
                      <div className="text-green-400 text-sm mt-1">
                        {selectedWinnerId === selectedMatch.team_b_participant_id ? '✅ ' : ''}
                        👑 Thắng +2 điểm
                      </div>
                    </div>
                    <div className={`text-4xl transition-transform ${
                      selectedWinnerId === selectedMatch.team_b_participant_id ? 'scale-110' : 'group-hover:scale-110'
                    }`}>
                      {selectedWinnerId === selectedMatch.team_b_participant_id ? '🏆' : '🎯'}
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={handleCloseModals}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={!selectedWinnerId}
                  onClick={() => {
                    if (!selectedWinnerId) {
                      showError('Vui lòng chọn đội thắng');
                      return;
                    }
                    // Đội thắng: 2 điểm, đội thua: 1 điểm
                    const scoreA = selectedWinnerId === selectedMatch.team_a_participant_id ? 2 : 1;
                    const scoreB = selectedWinnerId === selectedMatch.team_b_participant_id ? 2 : 1;
                    handleUpdateScore(selectedMatch.id, scoreA, scoreB);
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {selectedWinnerId ? 'Xác nhận kết quả' : 'Chọn đội thắng trước'}
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
