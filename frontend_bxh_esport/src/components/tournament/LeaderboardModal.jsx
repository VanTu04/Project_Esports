import { Card } from '../common/Card';
import Button from '../common/Button';

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
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-gray-400">
                      Không có dữ liệu bảng xếp hạng
                    </td>
                  </tr>
                )}
                {leaderboard.map((team, index) => (
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
                        onChange={(e) => onFieldChange(team.id, 'wins', e.target.value)}
                        className="w-16 text-center border border-primary-700/30 rounded bg-dark-300 text-white"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={team.losses || 0}
                        onChange={(e) => onFieldChange(team.id, 'losses', e.target.value)}
                        className="w-16 text-center border border-primary-700/30 rounded bg-dark-300 text-white"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={team.points || 0}
                        onChange={(e) => onFieldChange(team.id, 'points', e.target.value)}
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
