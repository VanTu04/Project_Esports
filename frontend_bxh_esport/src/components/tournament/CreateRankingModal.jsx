import { Card } from '../common/Card';
import Button from '../common/Button';

/**
 * Modal tạo bảng xếp hạng cho giải đấu
 */
export const CreateRankingModal = ({
  show,
  onClose,
  tournamentId,
  availableTeams,
  rankingTeams,
  tournamentStatus,
  saving,
  onAddTeam,
  onRemoveTeam,
  onStatusChange,
  onSave
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-primary-700/20 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">
            🧩 Tạo bảng xếp hạng
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Thêm đội tuyển
            </label>
            <div className="flex gap-2 flex-wrap">
              {availableTeams.map((team) => (
                <Button
                  key={team.id}
                  size="sm"
                  variant="ghost"
                  onClick={() => onAddTeam(team)}
                >
                  ➕ {team.name}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Danh sách đội đã chọn ({rankingTeams.length})
            </label>
            <div className="border border-primary-700/30 rounded-lg divide-y divide-primary-700/20">
              {rankingTeams.length === 0 && (
                <div className="text-gray-400 text-sm p-3">
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
                    <span className="font-medium text-white">
                      {team.name}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onRemoveTeam(team.id)}
                  >
                    Xóa
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Trạng thái giải đấu
            </label>
            <select
              value={tournamentStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black"
            >
              <option value="upcoming">Chưa diễn ra</option>
              <option value="live">Đang diễn ra</option>
              <option value="completed">Đã xong</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 border-t border-primary-700/20 pt-4">
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
