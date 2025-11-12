import { useState, useEffect } from 'react';
import { updateGame } from '../../services/gameService';
import { useNotification } from '../../context/NotificationContext';
import Button from '../common/Button';
import { Card } from '../common/Card';

export default function EditGameModal({ game, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    game_name: '',
    description: '',
    status: 'ACTIVE',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (game) {
      setFormData({
        game_name: game.game_name || '',
        description: game.description || '',
        status: game.status || 'ACTIVE',
      });
    }
  }, [game]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Xóa lỗi khi người dùng nhập
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.game_name.trim()) {
      newErrors.game_name = 'Tên game không được để trống';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await updateGame(game.id, formData);
      showSuccess('Cập nhật game thành công');
      onSuccess();
    } catch (error) {
      showError(error?.message || 'Cập nhật game thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-700/20">
          <h2 className="text-2xl font-bold text-white">Chỉnh sửa Game</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* ID (chỉ hiển thị) */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              ID
            </label>
            <input
              type="text"
              value={`#${game.id}`}
              disabled
              className="w-full px-4 py-2.5 border border-primary-700/30 rounded-lg bg-dark-500 text-gray-400 cursor-not-allowed"
            />
          </div>

          {/* Tên game */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Tên Game <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="game_name"
              value={formData.game_name}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.game_name
                  ? 'border-rose-500'
                  : 'border-primary-700/30'
              }`}
              placeholder="Nhập tên game"
            />
            {errors.game_name && (
              <p className="mt-1.5 text-sm text-rose-400">{errors.game_name}</p>
            )}
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2.5 border border-primary-700/30 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Nhập mô tả về game"
            />
          </div>

          {/* Trạng thái */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Trạng thái
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-primary-700/30 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Không hoạt động</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-primary-700/20">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              disabled={loading}
            >
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
