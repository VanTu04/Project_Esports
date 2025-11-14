import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { Loading } from '../common/Loading';
import Button from '../common/Button';
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
  const [activeTab, setActiveTab] = useState('teams'); // 'teams' or 'matches'
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isUpdateScoreModalOpen, setIsUpdateScoreModalOpen] = useState(false);
  const [isUpdateTimeModalOpen, setIsUpdateTimeModalOpen] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecorded, setIsRecorded] = useState(false);
  const [leaderboard, setLeaderboard] = useState(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [tournamentId]);
// Auto-create next round removed: manual creation only to avoid unexpected round generation
  const loadData = async () => {
    try {
      setLoading(true);
      // Lấy thông tin giải đấu
      const tournamentRes = await tournamentService.getTournamentById(tournamentId);
      setTournament(tournamentRes.data);

      // Lấy danh sách đội
      try {
        const teamsRes = await tournamentService.getParticipants(tournamentId, 'APPROVED');
        setTeams(teamsRes.data || []);
      } catch {
        setTeams([]);
      }

      // Lấy danh sách trận đấu: fetch tất cả vòng (1..total_rounds)
      try {
        const totalRounds = tournamentRes?.data?.total_rounds || tournamentRes?.total_rounds || 1;

        // Nếu totalRounds nhỏ (<=1) vẫn gọi 1 lần
        const roundsToFetch = Math.max(1, Number(totalRounds));

        const matchPromises = [];
        for (let r = 1; r <= roundsToFetch; r++) {
          matchPromises.push(
            tournamentService.getTournamentMatches(tournamentId, { round_number: r })
              .then(res => {
                // apiClient returns response.data (responseSuccess), but service might return array
                if (Array.isArray(res)) return res;
                if (res?.data && Array.isArray(res.data)) return res.data;
                // some endpoints return { matches: [...] }
                if (res?.matches && Array.isArray(res.matches)) return res.matches;
                return [];
              })
              .catch(() => [])
          );
        }

        const roundsMatches = await Promise.all(matchPromises);
        // flatten
        const matchesData = roundsMatches.flat();
        setMatches(matchesData);
      } catch (err) {
        console.error('loadData getTournamentMatches error', err);
        setMatches([]);
      }

      setLoading(false);
    } catch {
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
      if (!grouped[roundNum]) grouped[roundNum] = [];
      grouped[roundNum].push(match);
    });
    return grouped;
  };

  const handleOpenScoreModal = (match) => {
    setSelectedMatch(match);
    setSelectedWinnerId(null);
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
      const winnerId = scoreA > scoreB ? selectedMatch.team_a_participant_id : selectedMatch.team_b_participant_id;
      const response = await tournamentService.reportMatchResult(matchId, { winner_participant_id: winnerId });
      if (response?.code === 0) {
        showSuccess(response?.message || 'Cập nhật kết quả thành công!');
        handleCloseModals();
        loadData();
      } else {
        showError(response?.message || 'Không thể cập nhật kết quả');
      }
    } catch (error) {
      showError(error?.response?.data?.message || error?.message || 'Không thể cập nhật kết quả');
    }
  };

  const handleUpdateTime = async (matchId, scheduledTime) => {
    try {
      const response = await tournamentService.updateMatchSchedule(matchId, { match_time: new Date(scheduledTime).toISOString() });
      if (response?.code === 0) {
        showSuccess('Cập nhật thời gian thành công!');
        handleCloseModals();
        loadData();
      } else {
        showError(response?.message || 'Không thể cập nhật thời gian');
      }
    } catch (error) {
      showError(error?.response?.data?.message || error?.message || 'Không thể cập nhật thời gian');
    }
  };

  const handleStartNewRound = async () => {
    try {
      const response = await tournamentService.startTournament(tournamentId);
      if (response?.code === 0) {
        showSuccess(response?.message || 'Tạo vòng mới thành công!');
        loadData();
      } else {
        showError(response?.message || 'Không thể tạo vòng mới');
      }
    } catch (error) {
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
              Quay lại
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">{tournament.name}</h1>
              <p className="text-gray-300 text-sm">{tournament.game_name || 'Esports'}</p>
            </div>
          </div>
        </div>

        {/* Thông tin giải đấu */}
        <Card padding="lg">
          <h2 className="text-xl font-bold text-white mb-4">Thông tin giải đấu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg p-4 border border-primary-500/30 bg-primary-500/10">
              <span className="text-gray-300 text-sm">Vòng đấu</span>
              <p className="text-2xl font-bold text-white">{tournament.current_round || 0}/{tournament.total_rounds || 0}</p>
            </div>
            <div className="rounded-lg p-4 border border-blue-500/30 bg-blue-500/10">
              <span className="text-gray-300 text-sm">Số đội</span>
              <p className="text-2xl font-bold text-white">{teams.length}</p>
            </div>
            <div className="rounded-lg p-4 border border-green-500/30 bg-green-500/10">
              <span className="text-gray-300 text-sm">Trận đấu</span>
              <p className="text-2xl font-bold text-white">{matches.length}</p>
            </div>
            <div className="rounded-lg p-4 border border-yellow-500/30 bg-yellow-500/10">
              <span className="text-gray-300 text-sm">Trạng thái</span>
              <p className="text-lg font-bold text-yellow-400">{tournament.status || 'PENDING'}</p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="border-b border-primary-700/20">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('teams')}
              className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'teams' ? 'border-cyan-300 text-cyan-300' : 'border-transparent text-gray-300 hover:text-cyan-200 hover:border-cyan-400/50'
              }`}
            >
              Danh sách đội
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'matches' ? 'border-cyan-300 text-cyan-300' : 'border-transparent text-gray-300 hover:text-cyan-200 hover:border-cyan-400/50'
              }`}
            >
              Danh sách trận
            </button>
            <button
              onClick={async () => {
                setActiveTab('leaderboard');
                setLeaderboardLoading(true);
                try {
                  const resp = await tournamentService.getFinalLeaderboard(tournamentId);
                  const data = resp?.data?.data?.leaderboard ?? resp?.data?.leaderboard ?? resp?.data ?? resp;
                  setLeaderboard(Array.isArray(data) ? data : (data?.leaderboard ?? []));
                } catch (err) {
                  console.error('Failed to load leaderboard', err);
                  setLeaderboard([]);
                } finally {
                  setLeaderboardLoading(false);
                }
              }}
              className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'leaderboard' ? 'border-cyan-300 text-cyan-300' : 'border-transparent text-gray-300 hover:text-cyan-200 hover:border-cyan-400/50'
              }`}
            >
              Bảng xếp hạng
            </button>
          </div>
        </div>

        {/* Tab Content - Teams */}
        {activeTab === 'teams' && (
          <Card padding="lg">
            {teams.length === 0 ? (
              <div className="text-center py-12 text-gray-300">Chưa có đội tham gia</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-primary-700/20">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Hạng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Tên đội</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Wallet</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team, index) => (
                      <tr key={team.id} className="hover:bg-primary-500/10 transition-colors">
                        <td className="px-6 py-4 text-white font-bold">#{index + 1}</td>
                        <td className="px-6 py-4 text-white font-medium">{team.team_name}</td>
                        <td className="px-6 py-4 text-gray-300">{team.wallet_address ? `${team.wallet_address.substring(0, 10)}...` : 'N/A'}</td>
                        <td className="px-6 py-4">{getStatusBadge(team.status || 'APPROVED')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Tab Content - Matches */}
        {activeTab === 'matches' && (
          <div className="space-y-6">
            <div className="flex justify-end mb-4">
    <Button
  variant="primary"
  onClick={async () => {
    if (!tournamentId) return;

    // Chỉ cho phép ghi BXH khi giải đấu đã hoàn thành
    if ((tournament?.status || '').toUpperCase() !== 'COMPLETED') {
      showError('Chỉ có thể ghi BXH khi giải đấu đã kết thúc.');
      return;
    }

    // Ngăn chặn double click
    if (isRecording || isRecorded) return;

    setIsRecording(true);
    try {
      // Gọi backend để ghi BXH
      const resp = await tournamentService.recordRanking(tournamentId);

      if (resp?.code !== 0) {
        showError(resp.message || 'Không thể ghi BXH');
        setIsRecording(false);
        return;
      }

      setIsRecorded(true);
      showSuccess(resp.message || 'Ghi BXH thành công.');

      // Load lại BXH để hiển thị
      try {
        const lbResp = await tournamentService.getFinalLeaderboard(tournamentId);
        const data =
          lbResp?.data?.data?.leaderboard ??
          lbResp?.data?.leaderboard ??
          lbResp?.data ??
          lbResp;
        setLeaderboard(Array.isArray(data) ? data : data?.leaderboard ?? []);
        setActiveTab('leaderboard');
      } catch (err) {
        console.error('Không thể tải bảng xếp hạng', err);
        showError('Ghi BXH thành công nhưng không thể tải bảng xếp hạng.');
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.message || 'Không thể ghi BXH';
      showError(serverMsg);
    } finally {
      setIsRecording(false);
    }
  }}
  disabled={loading || isRecording || isRecorded}
>
  {isRecording
    ? 'Đang ghi BXH...'
    : isRecorded
    ? 'Đã ghi BXH'
    : 'Ghi BXH'}
</Button>


        </div>
            {Object.keys(groupedMatches).length === 0 ? (
              <Card padding="lg" className="text-center text-gray-300">Chưa có trận đấu</Card>
            ) : (
              Object.keys(groupedMatches).sort((a,b)=>a-b).map(round => (
                <Card key={round} padding="lg">
                  <h3 className="text-xl font-bold text-white mb-4">Vòng {round}</h3>
                  <div className="space-y-3">
                    {groupedMatches[round].map(match => (
                      <div key={match.id} className="rounded-lg p-4 border border-primary-500/30 bg-primary-500/10">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-gray-300 text-sm">
                            {match.match_time ? new Date(match.match_time).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'}) : 'Chưa có lịch'}
                          </span>
                          {getMatchStatusBadge(match.status)}
                        </div>
                        <div className="flex items-center justify-center gap-4 mb-3">
                          <div className="flex-1 text-right text-lg font-bold text-white">
                    {match.team_a_name || 'TBD'}
                    {match.winner_participant_id && (
                        <div className={`text-sm mt-1 ${match.winner_participant_id === match.team_a_participant_id ? 'text-green-400' : 'text-red-400'}`}>
                        {match.winner_participant_id === match.team_a_participant_id ? 'Thắng' : 'Thua'}
                        </div>
                    )}
                    </div>

                    <div className="text-2xl font-bold text-cyan-300 px-4">VS</div>

                    <div className="flex-1 text-left text-lg font-bold text-white">
                    {match.team_b_name || 'TBD'}
                    {match.winner_participant_id && (
                        <div className={`text-sm mt-1 ${match.winner_participant_id === match.team_b_participant_id ? 'text-green-400' : 'text-red-400'}`}>
                        {match.winner_participant_id === match.team_b_participant_id ? 'Thắng' : 'Thua'}
                        </div>
                    )}
                    </div>

                        </div>
                        <div className="flex justify-center gap-3 mt-2">
                    <div className="flex justify-center gap-3">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenTimeModal(match)}
                                disabled={match.status === 'COMPLETED'}
                                title={match.status === 'COMPLETED' ? 'Không thể thay đổi lịch trận đã kết thúc' : ''}
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
                                Cập nhật kết quả
                            </Button>
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

        {/* Tab Content - Leaderboard */}
        {activeTab === 'leaderboard' && (
          <Card padding="lg">
            <h2 className="text-xl font-bold text-white mb-4">Bảng xếp hạng cuối cùng</h2>
            {leaderboardLoading ? (
              <div className="text-center text-gray-300">Đang tải bảng xếp hạng...</div>
            ) : (!leaderboard || (Array.isArray(leaderboard) && leaderboard.length === 0)) ? (
              <div className="text-center text-gray-300">Chưa có bảng xếp hạng</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-primary-700/20">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Hạng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Tên đội / Wallet</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(leaderboard) ? leaderboard.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-primary-500/10 transition-colors">
                        <td className="px-6 py-4 text-white font-bold">#{idx + 1}</td>
                        <td className="px-6 py-4 text-white font-medium">{row.team_name || row.name || row.wallet || row.wallet_address || row.username}</td>
                        <td className="px-6 py-4 text-gray-300">{row.points ?? row.score ?? row.total_points ?? '-'}</td>
                      </tr>
                    )) : (
                      <tr><td className="px-6 py-4 text-gray-300">Không có dữ liệu</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Modals */}
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
            disabled={selectedMatch.status === 'COMPLETED'}
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
              if (selectedMatch.status === 'COMPLETED') {
                showError('Không thể gán lịch cho trận đấu đã kết thúc.');
                return;
              }
              const scheduledTime = document.getElementById('scheduledTime').value;
              if (!scheduledTime) {
                showError('Vui lòng chọn thời gian');
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
      {isUpdateScoreModalOpen && selectedMatch && (
        <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">Chọn đội thắng</h2>
              <div className="flex flex-col space-y-3">
                <button className={`p-4 border rounded ${selectedWinnerId===selectedMatch.team_a_participant_id?'bg-green-200':''}`} onClick={()=>setSelectedWinnerId(selectedMatch.team_a_participant_id)}>
                  {selectedMatch.team_a_name || 'Team A'}
                </button>
                <button className={`p-4 border rounded ${selectedWinnerId===selectedMatch.team_b_participant_id?'bg-green-200':''}`} onClick={()=>setSelectedWinnerId(selectedMatch.team_b_participant_id)}>
                  {selectedMatch.team_b_name || 'Team B'}
                </button>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={handleCloseModals}>Hủy</Button>
                <Button variant="primary" className="flex-1" disabled={!selectedWinnerId} onClick={()=>{
                  if(!selectedWinnerId) return;
                  const scoreA = selectedWinnerId===selectedMatch.team_a_participant_id?2:1;
                  const scoreB = selectedWinnerId===selectedMatch.team_b_participant_id?2:1;
                  handleUpdateScore(selectedMatch.id, scoreA, scoreB);
                }}>Xác nhận kết quả</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};

export default TournamentDetail;
