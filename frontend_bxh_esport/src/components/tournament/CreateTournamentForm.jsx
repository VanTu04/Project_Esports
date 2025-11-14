import { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { useNotification } from '../../context/NotificationContext';
import Button from '../common/Button';
import { Loading } from '../common/Loading';

export default function CreateTournamentForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    total_rounds: 3,
    game_id: '',
    season_id: '',
    start_date: '',
    end_date: '',
    description: '',
  });

  const [games, setGames] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [errors, setErrors] = useState({});
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

  // Tải danh sách mùa giải khi chọn game
  const loadSeasons = async (gameId) => {
    if (!gameId) {
      setSeasons([]);
      return;
    }

    try {
      setLoadingSeasons(true);
      const data = await apiClient.get(`${API_ENDPOINTS.SEASONS}/game/${gameId}`);
      setSeasons(data?.data || []);
    } catch (err) {
      showError('Không thể tải danh sách mùa giải');
      console.error('Load seasons error:', err);
      setSeasons([]);
    } finally {
      setLoadingSeasons(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear error khi user sửa
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Khi chọn game, tải danh sách mùa giải
    if (name === 'game_id') {
      setForm((prev) => ({ ...prev, season_id: '' }));
      loadSeasons(value);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate tên giải đấu
    if (!form.name || !form.name.trim()) {
      newErrors.name = 'Tên giải đấu không được để trống';
    } else if (form.name.trim().length < 3) {
      newErrors.name = 'Tên giải đấu phải có ít nhất 3 ký tự';
    } else if (form.name.trim().length > 100) {
      newErrors.name = 'Tên giải đấu không được quá 100 ký tự';
    }

    // Validate số vòng đấu
    const rounds = parseInt(form.total_rounds);
    if (!rounds || rounds < 1) {
      newErrors.total_rounds = 'Số vòng đấu phải lớn hơn 0';
    } else if (rounds > 20) {
      newErrors.total_rounds = 'Số vòng đấu không được quá 20';
    }

    // Validate dates
    if (!form.start_date) {
      newErrors.start_date = 'Vui lòng chọn ngày bắt đầu';
    }

    if (!form.end_date) {
      newErrors.end_date = 'Vui lòng chọn ngày kết thúc';
    }

    if (form.start_date && form.end_date) {
      const startDate = new Date(form.start_date);
      const endDate = new Date(form.end_date);
      
      if (startDate >= endDate) {
        newErrors.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
      }

      // Kiểm tra ngày bắt đầu không quá xa trong quá khứ
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      if (startDate < thirtyDaysAgo) {
        newErrors.start_date = 'Ngày bắt đầu không được quá 30 ngày trong quá khứ';
      }
    }

    // Validate description (optional nhưng nếu có thì phải hợp lệ)
    if (form.description && form.description.trim().length > 1000) {
      newErrors.description = 'Mô tả không được quá 1000 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      showError('Vui lòng kiểm tra lại thông tin');
      return;
    }

    try {
      setLoading(true);
      
      // Chuẩn bị payload
      const payload = {
        name: form.name.trim(),
        total_rounds: parseInt(form.total_rounds),
        game_id: form.game_id ? parseInt(form.game_id) : undefined,
        season_id: form.season_id ? parseInt(form.season_id) : undefined,
        start_date: form.start_date,
        end_date: form.end_date,
        description: form.description.trim() || undefined,
      };

      // Gọi API
      const response = await apiClient.post(API_ENDPOINTS.TOURNAMENTS, payload);
      
      // Kiểm tra response
      if (response.success || response.data) {
        showSuccess(response.message || 'Tạo giải đấu thành công!');
        
        // Reset form
        setForm({
          name: '',
          total_rounds: 3,
          game_id: '',
          season_id: '',
          start_date: '',
          end_date: '',
          description: '',
        });
        setSeasons([]);
        setErrors({});
        
        // Callback
        if (onCreated) {
          onCreated(response.data || response);
        }
      } else {
        throw new Error(response.message || 'Tạo giải đấu thất bại');
      }
    } catch (err) {
      console.error('❌ Create tournament error:', err);
      
      const errorMessage = 
        err?.response?.data?.message || 
        err?.data?.message || 
        err?.message || 
        'Lỗi khi tạo giải đấu';
      
      showError(errorMessage);
      
      // Nếu có lỗi từ server về field cụ thể
      if (err?.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({
      name: '',
      total_rounds: 3,
      game_id: '',
      season_id: '',
      start_date: '',
      end_date: '',
      description: '',
    });
    setSeasons([]);
    setErrors({});
  };

  return (
    <div className="w-full">
      {loadingGames ? (
        <div className="flex justify-center items-center py-12">
          <Loading size="md" text="Đang tải danh sách games..." />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tên giải đấu */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Tên giải đấu <span className="text-rose-400">*</span>
            </label>
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                errors.name ? 'border-rose-500' : 'border-primary-700/30'
              }`}
              placeholder="Ví dụ: Giải Esports Mùa Xuân 2025"
              maxLength={100}
            />
            {errors.name && (
              <p className="text-xs text-rose-400 mt-1">{errors.name}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {form.name.length}/100 ký tự
            </p>
          </div>

          {/* Số vòng đấu */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Số vòng đấu <span className="text-rose-400">*</span>
            </label>
            <input 
              name="total_rounds" 
              type="number"
              min="1"
              max="20"
              value={form.total_rounds} 
              onChange={handleChange} 
              className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                errors.total_rounds ? 'border-rose-500' : 'border-primary-700/30'
              }`}
            />
            {errors.total_rounds && (
              <p className="text-xs text-rose-400 mt-1">{errors.total_rounds}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Số vòng đấu trong giải (1-20 vòng)
            </p>
          </div>

          {/* Game và Season */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Game
              </label>
              <select 
                name="game_id" 
                value={form.game_id} 
                onChange={handleChange} 
                className="w-full px-4 py-2.5 border border-primary-700/30 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Chọn game (tùy chọn)</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name || game.game_name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Game mà giải đấu này thuộc về
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Mùa giải
              </label>
              <select 
                name="season_id" 
                value={form.season_id} 
                onChange={handleChange} 
                disabled={!form.game_id || loadingSeasons}
                className="w-full px-4 py-2.5 border border-primary-700/30 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingSeasons 
                    ? 'Đang tải...' 
                    : form.game_id 
                      ? 'Chọn mùa giải (tùy chọn)' 
                      : 'Vui lòng chọn game trước'}
                </option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.season_name || season.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Mùa giải cụ thể (nếu có)
              </p>
            </div>
          </div>

          {/* Ngày bắt đầu và kết thúc */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Ngày bắt đầu <span className="text-rose-400">*</span>
              </label>
              <input 
                name="start_date" 
                type="date"
                value={form.start_date} 
                onChange={handleChange} 
                className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.start_date ? 'border-rose-500' : 'border-primary-700/30'
                }`}
              />
              {errors.start_date && (
                <p className="text-xs text-rose-400 mt-1">{errors.start_date}</p>
              )}
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
                min={form.start_date || undefined}
                className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.end_date ? 'border-rose-500' : 'border-primary-700/30'
                }`}
              />
              {errors.end_date && (
                <p className="text-xs text-rose-400 mt-1">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Mô tả giải đấu
            </label>
            <textarea 
              name="description" 
              value={form.description} 
              onChange={handleChange} 
              rows="4"
              maxLength={1000}
              className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                errors.description ? 'border-rose-500' : 'border-primary-700/30'
              }`}
              placeholder="Nhập mô tả chi tiết về giải đấu: thể thức, giải thưởng, quy định..."
            />
            {errors.description && (
              <p className="text-xs text-rose-400 mt-1">{errors.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {form.description.length}/1000 ký tự
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-primary-700/20">
            <Button 
              type="button"
              variant="ghost"
              size="md"
              onClick={handleReset}
              disabled={loading}
            >
              Làm mới
            </Button>
            
            {onCancel && (
              <Button 
                type="button"
                variant="secondary"
                size="md"
                onClick={onCancel}
                disabled={loading}
              >
                Hủy
              </Button>
            )}
            
            <Button 
              type="submit" 
              variant="primary"
              size="md"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Đang tạo...' : 'Tạo giải đấu'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}