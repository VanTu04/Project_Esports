import { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { useNotification } from '../../context/NotificationContext';
import Button from '../common/Button';
import { Loading } from '../common/Loading';

export default function CreateTournamentForm({ onCreated }) {
  const [form, setForm] = useState({
    name: '',
    game_id: '',
    start_date: '',
    end_date: '',
    description: '',
  });

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingGames, setLoadingGames] = useState(true);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useNotification();

  // Tải danh sách game khi component được mount
  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setLoadingGames(true);
      const data = await apiClient.get(API_ENDPOINTS.GAMES);
      setGames(data?.data || []);
    } catch (err) {
      showError('Không thể tải danh sách games');
      console.error('Load games error:', err);
    } finally {
      setLoadingGames(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Kiểm tra dữ liệu đầu vào
    if (!form.name) {
      setError('Tên giải đấu không được để trống.');
      return;
    }

    if (!form.game_id) {
      setError('Vui lòng chọn game.');
      return;
    }

    if (!form.start_date || !form.end_date) {
      setError('Vui lòng chọn ngày bắt đầu và kết thúc.');
      return;
    }

    try {
      setLoading(true);
      
      // Backend sử dụng /ranking-board để tạo giải đấu (tournament)
      const payload = {
        tournament_name: form.name,
        game_id: parseInt(form.game_id),
        start_date: form.start_date,
        end_date: form.end_date,
        description: form.description,
      };

      const res = await apiClient.post(API_ENDPOINTS.RANKING_BOARD, payload);
      
      if (onCreated) onCreated(res);
      showSuccess('Tạo giải đấu thành công');
      
      // Đặt lại form về trạng thái ban đầu
      setForm({
        name: '',
        game_id: '',
        start_date: '',
        end_date: '',
        description: '',
      });
    } catch (err) {
      console.error('Create tournament error:', err);
      
      const message = err?.message || 
                      err?.error || 
                      err?.data?.message || 
                      'Lỗi tạo giải đấu';
      
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="text-sm text-rose-300 mb-4 p-3 bg-rose-500/20 rounded-lg border border-rose-500/30">
          {error}
        </div>
      )}

      {loadingGames ? (
        <Loading size="md" text="Đang tải danh sách games..." />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Tên giải đấu <span className="text-rose-400">*</span>
            </label>
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              className="w-full px-4 py-2.5 border border-primary-700/30 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
              placeholder="Nhập tên giải đấu"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Game <span className="text-rose-400">*</span>
            </label>
            <select 
              name="game_id" 
              value={form.game_id} 
              onChange={handleChange} 
              className="w-full px-4 py-2.5 border border-primary-700/30 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Chọn game</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name || game.game_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Ngày bắt đầu <span className="text-rose-400">*</span>
              </label>
              <input 
                name="start_date" 
                type="date"
                value={form.start_date} 
                onChange={handleChange} 
                className="w-full px-4 py-2.5 border border-primary-700/30 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Ngày kết thúc <span className="text-rose-400">*</span>
              </label>
              <input 
                name="end_date" 
                type="date"
                value={form.end_date} 
                onChange={handleChange} 
                className="w-full px-4 py-2.5 border border-primary-700/30 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Mô tả
            </label>
            <textarea 
              name="description" 
              value={form.description} 
              onChange={handleChange} 
              rows="3"
              className="w-full px-4 py-2.5 border border-primary-700/30 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
              placeholder="Nhập mô tả giải đấu (tùy chọn)"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-primary-700/20">
            <Button 
              type="submit" 
              variant="primary"
              size="md"
              loading={loading}
              disabled={loading}
            >
              Tạo giải đấu
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}