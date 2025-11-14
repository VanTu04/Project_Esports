import { useEffect, useState } from 'react';
import { Card } from '../common/Card';
import Button from '../common/Button';
import tournamentService from '../../services/tournamentService';
import rewardService from '../../services/rewardService';
import { apiClient } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

/**
 * Modal xem và chỉnh sửa bảng xếp hạng
 */
export const LeaderboardModal = ({
  show,
  onClose,
  tournamentId,
  leaderboard,
  status,
  saving,
  onStatusChange,
  onFieldChange,
  onSave
}) => {
  const { showError, showSuccess } = useNotification();
  const [localLeaderboard, setLocalLeaderboard] = useState(leaderboard || []);
  const [loading, setLoading] = useState(false);
  const [rewardsMap, setRewardsMap] = useState({});
  const [distributing, setDistributing] = useState(false);
  const [distributionsMap, setDistributionsMap] = useState({});

  useEffect(() => {
    // When modal opens, fetch final leaderboard from blockchain endpoint
    const fetchFinalLeaderboard = async () => {
      if (!show || !tournamentId) return;
      setLoading(true);
      try {
        const resp = await tournamentService.getFinalLeaderboard(tournamentId);

        // Backend returns: { code:0, status:200, message, data: { tournamentId, leaderboard: [...] } }
        // Normalize many possible shapes into an array `dataArr`
        let dataArr = [];

        if (resp?.code === 0 && resp?.data?.leaderboard && Array.isArray(resp.data.leaderboard)) {
          dataArr = resp.data.leaderboard;
        } else if (resp?.data && Array.isArray(resp.data)) {
          // some endpoints might return array directly in data
          dataArr = resp.data;
        } else if (Array.isArray(resp)) {
          // apiClient may already return the raw array
          dataArr = resp;
        } else if (resp?.leaderboard && Array.isArray(resp.leaderboard)) {
          dataArr = resp.leaderboard;
        }

        // Try to fetch reward tiers for this tournament (optional)
        let rMap = undefined;
        try {
          const rResp = await rewardService.getTournamentRewards(tournamentId);
          let rData = [];
          if (rResp?.code === 0 && Array.isArray(rResp.data)) rData = rResp.data;
          else if (Array.isArray(rResp)) rData = rResp;
          // build map rank -> reward_amount
          rMap = {};
          rData.forEach(r => {
            if (r.rank != null) rMap[Number(r.rank)] = r.reward_amount;
          });
          setRewardsMap(rMap);
        } catch (e) {
          // ignore if reward fetch fails
          console.debug('No rewards for tournament or failed to fetch:', e?.message || e);
        }

        // Try to fetch distribution history (latest per rank)
        try {
          const dResp = await tournamentService.getDistributions(tournamentId);
          let dData = [];
          if (dResp?.code === 0 && Array.isArray(dResp.data)) dData = dResp.data;
          else if (Array.isArray(dResp)) dData = dResp;

          // backend returns ordered by createdAt DESC; keep first occurrence per rank
          const dMap = {};
          (dData || []).forEach(d => {
            const rk = Number(d.rank);
            if (!dMap[rk]) dMap[rk] = d;
          });
          setDistributionsMap(dMap);
        } catch (e) {
          console.debug('Failed to fetch distributions:', e?.message || e);
        }

        // normalize to array of {id,name,logo,wins,losses,points}
        const normalized = (dataArr || []).map((item, idx) => ({
          // prefer wallet or userId as stable id
          id: item.wallet ?? item.id ?? item.team_id ?? item.userId ?? `t${idx}`,
          // prefer username, then team name
          name: item.username ?? item.fullname ?? item.name ?? item.team_name ?? `Team ${idx+1}`,
          // avatar if available
          logo: item.avatar ?? item.logo ?? '/default-team.png',
          // backend provides score (points). wins/losses not available from chain so keep editable fields defaulted to 0
          wins: item.wins ?? item.wins_count ?? 0,
          losses: item.losses ?? 0,
          points: item.points ?? item.score ?? 0,
          reward: null, // will be filled below
        }));

        // Attach reward amount from fetched rewardsMap (if available)
        const withRewards = normalized.map((row, i) => ({
          ...row,
          reward: (rMap ? rMap[i + 1] : (rewardsMap[i + 1] ?? row.reward)) ?? null
        }));

        setLocalLeaderboard(withRewards);
      } catch (err) {
        console.error('Failed to fetch final leaderboard:', err);
        showError('Không thể tải bảng xếp hạng từ blockchain.');
        // fallback to provided leaderboard prop
        setLocalLeaderboard(leaderboard || []);
      } finally {
        setLoading(false);
      }
    };

    fetchFinalLeaderboard();
  }, [show, tournamentId]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-primary-700/20 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">
            Bảng xếp hạng Giải {tournamentId}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Bảng đội */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-primary-700/20">
              <thead className="bg-dark-300">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Đội</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400">Phần thưởng</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400">Giao dịch</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400">Thắng</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400">Thua</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400">Điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-700/20">
                      {(!loading && localLeaderboard.length === 0) && (
                        <tr>
                          <td colSpan="7" className="text-center py-6 text-gray-400">
                            Không có dữ liệu bảng xếp hạng
                          </td>
                        </tr>
                      )}
                      {(localLeaderboard || leaderboard || []).map((team, index) => (
                  <tr key={team.id} className="hover:bg-dark-300/50 transition-colors">
                    <td className="px-4 py-3 text-gray-300">{index + 1}</td>
                    <td className="px-4 py-3 flex items-center gap-3">
                      <img
                        src={team.logo || '/default-team.png'}
                        className="w-8 h-8 rounded-full object-cover"
                        alt={team.name || team.team || 'team'}
                      />
                      <span className="text-white font-medium">
                        {team.name || team.team || 'Không rõ tên'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">{team.reward ?? '-'}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-300">
                      {(() => {
                        const d = distributionsMap[index + 1];
                        if (!d) return '-';
                        // show status and shortened tx
                        const tx = d.tx_hash || d.txHash || null;
                        const status = d.status || (d.tx_hash ? 'SUCCESS' : (d.error_message ? 'FAILED' : 'PENDING'));
                        return (
                          <div className="flex flex-col items-center text-xs">
                            <span className="font-medium">{status}</span>
                            {tx ? (
                              <a href={`https://etherscan.io/tx/${tx}`} target="_blank" rel="noreferrer" className="text-amber-300 underline mt-1">{tx.slice(0, 8)}...{tx.slice(-6)}</a>
                            ) : null}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={team.wins ?? 0}
                        onChange={(e) => {
                          // update local state and propagate
                          const val = parseInt(e.target.value) || 0;
                          setLocalLeaderboard(prev => prev.map(x => x.id === team.id ? { ...x, wins: val } : x));
                          onFieldChange?.(team.id, 'wins', val);
                        }}
                        className="w-16 text-center border border-primary-700/30 rounded bg-dark-300 text-white"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={team.losses || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setLocalLeaderboard(prev => prev.map(x => x.id === team.id ? { ...x, losses: val } : x));
                          onFieldChange?.(team.id, 'losses', val);
                        }}
                        className="w-16 text-center border border-primary-700/30 rounded bg-dark-300 text-white"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={team.points || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setLocalLeaderboard(prev => prev.map(x => x.id === team.id ? { ...x, points: val } : x));
                          onFieldChange?.(team.id, 'points', val);
                        }}
                        className="w-20 text-center border border-primary-700/30 rounded bg-dark-300 text-white"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Nút lưu */}
          <div className="flex justify-between items-center border-t border-primary-700/20 pt-4 gap-3">
            <div>
              <button
                onClick={async () => {
                  // Call wallet distribute endpoint: POST /wallet/distribute-rewards with body { idTournament }
                  if (!tournamentId) return showError('Thiếu tournamentId');
                  setDistributing(true);
                  try {
                    const resp = await apiClient.post('/wallet/distribute-rewards', { idTournament: Number(tournamentId) });
                    showSuccess('Đã gửi yêu cầu phân phối. Kiểm tra log để biết trạng thái.');
                    console.debug('distribute response:', resp);
                  } catch (err) {
                    console.error('Distribute error', err);
                    showError(err?.message || 'Phân phối thất bại');
                  } finally {
                    setDistributing(false);
                  }
                }}
                className="bg-amber-600 text-black px-3 py-2 rounded font-semibold hover:opacity-90"
                disabled={distributing}
              >
                {distributing ? 'Đang phân phối...' : 'Phân phối'}
              </button>
            </div>
            <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={onSave}
              disabled={saving}
              loading={saving}
            >
              Lưu bảng xếp hạng
            </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
