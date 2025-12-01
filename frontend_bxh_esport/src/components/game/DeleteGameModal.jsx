import Button from '../common/Button';
import { Card } from '../common/Card';

export default function DeleteGameModal({ game, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-700/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Xác nhận xóa</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300 mb-4">
            Bạn có chắc chắn muốn xóa game này không?
          </p>
          <div className="bg-dark-300 rounded-lg p-4 border border-primary-700/20">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">ID:</span>
                <span className="text-white font-medium">#{game.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Tên game:</span>
                <span className="text-white font-medium">{game.game_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Trạng thái:</span>
                {game.status === 'ACTIVE' ? (
                  <span className="text-emerald-400 font-medium">Hoạt động</span>
                ) : (
                  <span className="text-gray-400 font-medium">Không hoạt động</span>
                )}
              </div>
              {game.description && (
                <div className="flex items-start justify-between">
                  <span className="text-sm text-gray-400">Mô tả:</span>
                  <span className="text-white text-sm text-right ml-4">{game.description}</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-rose-400 mt-4">
            ⚠️ Hành động này không thể hoàn tác!
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 pt-0">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            Xóa Game
          </Button>
        </div>
      </Card>
    </div>
  );
}
