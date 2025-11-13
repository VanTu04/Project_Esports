import { useState } from 'react';
import { createSeason } from '../../services/seasonService';
import { useNotification } from '../../context/NotificationContext';
import Button from '../common/Button';
import { Card } from '../common/Card';

export default function CreateSeasonModal({ games, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    game_id: games?.length === 1 ? games[0].id : '',
    season_name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'PREPARING',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { showSuccess, showError } = useNotification();

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

    if (!formData.game_id) {
      newErrors.game_id = 'Vui lòng chọn game';
    }

    if (!formData.season_name.trim()) {
      newErrors.season_name = 'Tên mùa giải không được để trống';
    }

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        newErrors.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
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
      const response = await createSeason(formData);
      // Hiển thị message từ backend
      if (response?.message) {
        showSuccess(response.message);
      }
      // Truyền response lên parent
      onSuccess(response);
    } catch (error) {
      // Hiển thị error message từ backend
      showError(error?.message || 'Tạo mùa giải thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-700/20">
          <div>
            <h2 className="text-2xl font-bold text-white">Thêm Mùa giải Mới</h2>
            <p className="text-sm text-gray-400 mt-1">Tạo mùa giải mới cho game</p>
          </div>
          {/* <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button> */}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Game */}
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-white mb-2">
                Game <span className="text-rose-400">*</span>
              </label>
              <select
                name="game_id"
                value={formData.game_id}
                onChange={handleChange}
                disabled={games?.length === 1}
                className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  games?.length === 1 ? 'opacity-75 cursor-not-allowed' : ''
                } ${
                  errors.game_id
                    ? 'border-rose-500'
                    : 'border-primary-700/30'
                }`}
              >
                <option value="">Chọn game</option>
                {games.map(game => (
                  <option key={game.id} value={game.id}>
                    {game.game_name}
                  </option>
                ))}
              </select>
              {errors.game_id && (
                <p className="mt-1.5 text-sm text-rose-400">{errors.game_id}</p>
              )}
            </div>

            {/* Trạng thái */}
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-white mb-2">
                Trạng thái
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-primary-700/30 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="PREPARING">Chuẩn bị</option>
                <option value="IN_PROGRESS">Đang diễn ra</option>
                <option value="FINISHED">Đã kết thúc</option>
              </select>
            </div>

            {/* Tên mùa giải */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-white mb-2">
                Tên Mùa giải <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="season_name"
                value={formData.season_name}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.season_name
                    ? 'border-rose-500'
                    : 'border-primary-700/30'
                }`}
                placeholder="VD: VCS Mùa Xuân 2024"
              />
              {errors.season_name && (
                <p className="mt-1.5 text-sm text-rose-400">{errors.season_name}</p>
              )}
            </div>

            {/* Ngày bắt đầu */}
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-white mb-2">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-primary-700/30 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Ngày kết thúc */}
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-white mb-2">
                Ngày kết thúc
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.end_date
                    ? 'border-rose-500'
                    : 'border-primary-700/30'
                }`}
              />
              {errors.end_date && (
                <p className="mt-1.5 text-sm text-rose-400">{errors.end_date}</p>
              )}
            </div>

            {/* Mô tả */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-white mb-2">
                Mô tả
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2.5 border border-primary-700/30 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Nhập mô tả về mùa giải (tùy chọn)"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-primary-700/20">
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
              Tạo Mùa giải
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
