import { useEffect, useState } from 'react';
import { Card } from '../common/Card';
import Button from '../common/Button';
import tournamentService from '../../services/tournamentService';
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
  const { showError } = useNotification();
  const [localLeaderboard, setLocalLeaderboard] = useState(leaderboard || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // When modal opens, fetch final leaderboard from blockchain endpoint
    const fetchFinalLeaderboard = async () => {
      if (!show || !tournamentId) return;
      setLoading(true);
      try {
        const resp = await tournamentService.getFinalLeaderboard(tournamentId);
        // Support multiple response shapes
        let data = [];
        if (resp?.code === 0 && resp?.data) data = resp.data;
        else if (resp?.data) data = resp.data;
        else if (Array.isArray(resp)) data = resp;
        else if (resp?.leaderboard) data = resp.leaderboard;

        // normalize to array of {id,name,logo,wins,losses,points}
        const normalized = (data || []).map((item, idx) => ({
          id: item.id ?? item.team_id ?? `t${idx}`,
          name: item.name ?? item.team ?? item.team_name ?? `Team ${idx+1}`,
          logo: item.logo ?? item.avatar ?? '/default-team.png',
          wins: item.wins ?? item.wins_count ?? item.w ?? 0,
          losses: item.losses ?? item.l ?? 0,
          points: item.points ?? item.score ?? item.p ?? 0,
        }));

        setLocalLeaderboard(normalized);
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
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400">Thắng</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400">Thua</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400">Điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-700/20">
                {(!loading && localLeaderboard.length === 0) && (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-gray-400">
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
          <div className="flex justify-end border-t border-primary-700/20 pt-4 gap-3">
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
      </Card>
    </div>
  );
};
