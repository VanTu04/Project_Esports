import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { apiClient } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { useNotification } from '../../context/NotificationContext';
import Button from '../common/Button';
import { Loading } from '../common/Loading';
import { getActiveGames } from '../../services/gameService';
import rewardService from '../../services/rewardService';

export default function CreateTournamentForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    game_id: '',
    total_rounds: 3,
    expected_teams: '',
    start_date: '',
    end_date: '',
    description: '',
    rewards: [],
    registration_fee: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [games, setGames] = useState([]);
  const { showSuccess, showError } = useNotification();
  const [startDateObj, setStartDateObj] = useState(form.start_date ? new Date(form.start_date) : null);
  const [endDateObj, setEndDateObj] = useState(form.end_date ? new Date(form.end_date) : null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Load active games on mount
  useEffect(() => {
    const loadGames = async () => {
      try {
        const response = await getActiveGames();
        
        // Parse response - backend có thể trả về { data: { code: 0, data: [...games] } }
        let gamesData = [];
        if (response?.data?.data && Array.isArray(response.data.data)) {
          gamesData = response.data.data;
        } else if (Array.isArray(response?.data)) {
          gamesData = response.data;
        } else if (Array.isArray(response)) {
          gamesData = response;
        }
        
        setGames(gamesData);
      } catch (error) {
        showError('Không thể tải danh sách game');
        setGames([]);
      }
    };
    loadGames();
  }, []);

  useEffect(() => {
    setStartDateObj(form.start_date ? (function parseISOToLocal(d){ const p = String(d).split('-').map(Number); return p.length===3 ? new Date(p[0], p[1]-1, p[2]) : new Date(d); })(form.start_date) : null);
  }, [form.start_date]);

  useEffect(() => {
    setEndDateObj(form.end_date ? (function parseISOToLocal(d){ const p = String(d).split('-').map(Number); return p.length===3 ? new Date(p[0], p[1]-1, p[2]) : new Date(d); })(form.end_date) : null);
  }, [form.end_date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name || !form.name.trim()) {
      newErrors.name = 'Tên giải đấu không được để trống';
    } else if (form.name.trim().length < 3) {
      newErrors.name = 'Tên giải đấu phải có ít nhất 3 ký tự';
    } else if (form.name.trim().length > 100) {
      newErrors.name = 'Tên giải đấu không được quá 100 ký tự';
    }

    // Validate game_id (required)
    if (!form.game_id) {
      newErrors.game_id = 'Vui lòng chọn game cho giải đấu';
    }

    const rounds = parseInt(form.total_rounds);
    if (!rounds || rounds < 1) {
      newErrors.total_rounds = 'Số vòng đấu phải lớn hơn 0';
    } else if (rounds > 20) {
      newErrors.total_rounds = 'Số vòng đấu không được quá 20';
    }

    // Validate expected teams (required)
    if (!form.expected_teams) {
      newErrors.expected_teams = 'Vui lòng nhập số đội tham gia';
    } else {
      const t = parseInt(form.expected_teams);
      if (!t || t < 2) {
        newErrors.expected_teams = 'Số đội phải là số nguyên >= 2';
      }
    }

    if (!form.start_date) {
      newErrors.start_date = 'Vui lòng chọn ngày bắt đầu';
    }
    if (!form.end_date) {
      newErrors.end_date = 'Vui lòng chọn ngày kết thúc';
    }

    if (form.start_date && form.end_date) {
      const startDate = new Date(form.start_date);
      const endDate = new Date(form.end_date);
      // End date must not be before start date (allow same-day end)
      if (endDate < startDate) {
        newErrors.end_date = 'Ngày kết thúc không được trước ngày bắt đầu';
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      if (startDate < thirtyDaysAgo) {
        newErrors.start_date = 'Ngày bắt đầu không được quá 30 ngày trong quá khứ';
      }
    }

    if (form.description && form.description.trim().length > 1000) {
      newErrors.description = 'Mô tả không được quá 1000 ký tự';
    }

    // Validate rewards (required - at least one reward)
    if (!Array.isArray(form.rewards) || form.rewards.length === 0) {
      newErrors.rewards = 'Vui lòng thêm ít nhất một phần thưởng cho giải đấu';
    } else {
      form.rewards.forEach((r, idx) => {
        if (!r || typeof r.rank === 'undefined' || r.rank === null || String(r.rank).trim() === '') {
          newErrors[`rewards.${idx}.rank`] = 'Rank bắt buộc';
        } else if (Number(r.rank) < 1) {
          newErrors[`rewards.${idx}.rank`] = 'Rank phải >= 1';
        }

        if (typeof r.reward_amount === 'undefined' || r.reward_amount === null || String(r.reward_amount).trim() === '') {
          newErrors[`rewards.${idx}.reward_amount`] = 'Số tiền thưởng bắt buộc';
        } else if (Number(r.reward_amount) < 0) {
          newErrors[`rewards.${idx}.reward_amount`] = 'Số tiền thưởng không được âm';
        }
      });
    }

    // Validate registration fee (required)
    if (form.registration_fee === '' || form.registration_fee === null || form.registration_fee === undefined) {
      newErrors.registration_fee = 'Vui lòng nhập phí đăng ký';
    } else {
      const fee = Number(form.registration_fee);
      if (isNaN(fee) || fee < 0) {
        newErrors.registration_fee = 'Phí đăng ký phải là số ETH >= 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  

  // Tính số vòng Swiss theo công thức chuẩn dựa trên số đội
  const computeSwissRounds = (n) => {
    const teams = Number(n) || 0;

    if (teams < 2) {
      return {
        min: 0,
        max: 0,
        recommendedMin: 0,
        recommendedMax: 0
      };
    }

    const log2Val = Math.ceil(Math.log2(teams));

    return {
      min: log2Val,            // rounds tối thiểu: log2(n)
      max: teams - 1,          // rounds tối đa: n-1
      recommendedMin: log2Val,     // khuyến nghị thấp nhất
      recommendedMax: log2Val + 2  // khuyến nghị cao nhất
    };
  };

  // Rewards handlers
  const handleAddReward = () => {
    const currentRewards = form.rewards || [];
    const nextRank = currentRewards.length + 1;
    setForm(prev => ({ ...prev, rewards: [...currentRewards, { rank: nextRank, reward_amount: '' }] }));
  };

  const handleRemoveReward = (idx) => {
    setForm(prev => ({ ...prev, rewards: prev.rewards.filter((_, i) => i !== idx) }));
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[`rewards.${idx}.rank`];
      delete copy[`rewards.${idx}.reward_amount`];
      return copy;
    });
  };

  const handleRewardChange = (idx, field, value) => {
    setForm(prev => {
      const rewards = Array.isArray(prev.rewards) ? [...prev.rewards] : [];
      rewards[idx] = { ...rewards[idx], [field]: value };
      return { ...prev, rewards };
    });
    // clear specific error
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[`rewards.${idx}.${field}`];
      return copy;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        showError('Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Vui lòng kiểm tra lại thông tin');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('name', form.name.trim());
      if (form.game_id) formData.append('game_id', form.game_id);
      formData.append('total_rounds', form.total_rounds);
      formData.append('start_date', form.start_date);
      formData.append('end_date', form.end_date);
      formData.append('total_team', form.expected_teams ? parseInt(form.expected_teams) : 2);
      if (form.description) formData.append('description', form.description.trim());
      formData.append('registration_fee', form.registration_fee !== '' ? Number(form.registration_fee) : 1);
      if (imageFile) formData.append('image', imageFile);
      
      // Gửi rewards dưới dạng JSON string (backend sẽ parse)
      if (Array.isArray(form.rewards) && form.rewards.length > 0) {
        const rewardsData = form.rewards.map(r => ({ 
          rank: Number(r.rank), 
          reward_amount: Number(r.reward_amount) 
        }));
        formData.append('rewards', JSON.stringify(rewardsData));
        console.log('🎁 Sending rewards:', rewardsData);
      }

      console.log('📤 Creating tournament...');
      const response = await apiClient.post(API_ENDPOINTS.TOURNAMENTS, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('✅ Tournament created:', response);

      if (response.success || response.data) {
        showSuccess('Tạo giải đấu thành công!');
        setForm({
          name: '',
          game_id: '',
          total_rounds: 3,
          expected_teams: '',
          start_date: '',
          end_date: '',
          description: '',
          rewards: [],
          registration_fee: '',
        });
        setErrors({});
        setImageFile(null);
        setImagePreview(null);

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
      game_id: '',
      total_rounds: 3,
      expected_teams: '',
      start_date: '',
      end_date: '',
      description: '',
      rewards: [],
      registration_fee: '',
    });
    setErrors({});
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Layout 2 cột cho các trường cơ bản */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cột trái */}
          <div className="space-y-5">
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
              {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
              <p className="text-xs text-gray-400 mt-1">{form.name.length}/100 ký tự</p>
            </div>

            {/* Game */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Game <span className="text-rose-400">*</span>
              </label>
              <select
                name="game_id"
                value={form.game_id}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.game_id ? 'border-rose-500' : 'border-primary-700/30'
                }`}
              >
                <option value="">-- Chọn game --</option>
                {games.map(game => (
                  <option key={game.id} value={game.id}>{game.game_name}</option>
                ))}
              </select>
              {errors.game_id && <p className="text-xs text-rose-400 mt-1">{errors.game_id}</p>}
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
              {errors.total_rounds && <p className="text-xs text-rose-400 mt-1">{errors.total_rounds}</p>}
              <p className="text-xs text-gray-400 mt-1">Số vòng đấu trong giải (1-20 vòng)</p>
              {/* Swiss-system round suggestions - show when total_rounds is entered */}
              {form.total_rounds && (
                <div className="mt-1 text-xs text-gray-300">
                  {(() => {
                    const rounds = parseInt(form.total_rounds);
                    if (!rounds || rounds < 1) return null;
                    // Calculate suggested team range for given rounds
                    const minTeams = Math.pow(2, rounds - 1) + 1;
                    const maxTeams = Math.pow(2, rounds);
                    return (
                      <div>💡 Với <strong>{rounds}</strong> vòng, gợi ý: <strong>{minTeams}–{maxTeams}</strong> đội tham gia</div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Số đội tham gia */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Số đội tham gia <span className="text-rose-400">*</span>
              </label>
              <input
                name="expected_teams"
                type="number"
                min="1"
                value={form.expected_teams}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.expected_teams ? 'border-rose-500' : 'border-primary-700/30'
                }`}
              />
              {errors.expected_teams && <p className="text-xs text-rose-400 mt-1">{errors.expected_teams}</p>}
              <p className="text-xs text-gray-400 mt-1">Số đội dự kiến tham gia giải đấu</p>
              {form.expected_teams && form.total_rounds && (() => {
                const t = parseInt(form.expected_teams);
                const rounds = parseInt(form.total_rounds);
                const { min, max, recommendedMin, recommendedMax } = computeSwissRounds(form.expected_teams);
                if (!t || !rounds) return null;
                if (rounds < min) {
                  return <p className="text-xs text-amber-300 mt-1">⚠️ Số vòng {rounds} nhỏ hơn khuyến nghị ({min} vòng) cho {t} đội</p>;
                }
                if (rounds > max) {
                  return <p className="text-xs text-amber-300 mt-1">⚠️ Số vòng {rounds} lớn hơn tối đa ({max} vòng) cho {t} đội</p>;
                }
                if (rounds >= recommendedMin && rounds <= recommendedMax) {
                  return <p className="text-xs text-green-400 mt-1">✓ Số vòng {rounds} phù hợp (khuyến nghị: {recommendedMin}–{recommendedMax} vòng)</p>;
                }
                return <p className="text-xs text-blue-400 mt-1">ℹ️ Số vòng {rounds} hợp lệ (khuyến nghị tốt nhất: {recommendedMin}–{recommendedMax} vòng)</p>;
              })()}
            </div>

            {/* Ngày bắt đầu & Ngày kết thúc - 1 hàng */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Ngày bắt đầu <span className="text-rose-400">*</span>
                </label>
                <DatePicker
                  selected={startDateObj}
                  onChange={(date) => {
                    setStartDateObj(date);
                    const iso = date ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}` : '';
                    setForm(prev => ({ ...prev, start_date: iso }));
                    if (date && endDateObj && endDateObj < date) {
                      setEndDateObj(null);
                      setForm(prev => ({ ...prev, end_date: '' }));
                    }
                    if (errors.start_date) {
                      setErrors(prev => { const c = { ...prev }; delete c.start_date; return c; });
                    }
                  }}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="dd/mm/yyyy"
                  className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.start_date ? 'border-rose-500' : 'border-primary-700/30'}`}
                />
                {errors.start_date && <p className="text-xs text-rose-400 mt-1">{errors.start_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Ngày kết thúc <span className="text-rose-400">*</span>
                </label>
                <DatePicker
                  selected={endDateObj}
                  onChange={(date) => {
                    setEndDateObj(date);
                    const iso = date ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}` : '';
                    setForm(prev => ({ ...prev, end_date: iso }));
                    if (errors.end_date) {
                      setErrors(prev => { const c = { ...prev }; delete c.end_date; return c; });
                    }
                  }}
                  minDate={startDateObj || null}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="dd/mm/yyyy"
                  className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.end_date ? 'border-rose-500' : 'border-primary-700/30'}`}
                />
                {errors.end_date && <p className="text-xs text-rose-400 mt-1">{errors.end_date}</p>}
              </div>
            </div>

            {/* Phí đăng ký */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Phí đăng ký (ETH) <span className="text-rose-400">*</span>
              </label>
              <input
                name="registration_fee"
                type="number"
                min="0"
                step="0.0001"
                value={form.registration_fee}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.registration_fee ? 'border-rose-500' : 'border-primary-700/30'
                }`}
                placeholder="0.01"
              />
              {errors.registration_fee && (
                <p className="text-xs text-rose-400 mt-1">{errors.registration_fee}</p>
              )}
            </div>
          </div>

          {/* Cột phải */}
          <div className="space-y-5">
            {/* Upload ảnh */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Ảnh giải đấu <span className="text-rose-400">*</span>
              </label>
              <div className="flex flex-col gap-3">
                {imagePreview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-primary-500">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-rose-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-500 file:text-white hover:file:bg-primary-600 transition-colors border-primary-700/30"
                />
                <p className="text-xs text-gray-400">JPG, PNG, WEBP (tối đa 5MB)</p>
              </div>
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Mô tả
              </label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                rows="10"
                maxLength={1000}
                className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none ${
                  errors.description ? 'border-rose-500' : 'border-primary-700/30'
                }`}
                placeholder="Nhập mô tả chi tiết về giải đấu: thể thức, giải thưởng, quy định..."
              />
              {errors.description && <p className="text-xs text-rose-400 mt-1">{errors.description}</p>}
              <p className="text-xs text-gray-400 mt-1">{form.description.length}/1000 ký tự</p>
            </div>
          </div>
        </div>

        {/* Phần thưởng - Full width */}
        <div className="border-t border-primary-700/20 pt-6">
          <label className="block text-sm font-semibold text-white mb-3">Phần thưởng <span className="text-rose-400">*</span></label>
          {errors.rewards && <p className="text-sm text-rose-400 mb-3">{errors.rewards}</p>}
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {(form.rewards || []).map((r, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_2fr_auto] gap-4 items-start bg-primary-900/20 p-4 rounded-lg border border-primary-700/20">
                <div>
                  <label className="text-xs font-medium text-gray-300 mb-1 block">Hạng</label>
                  <input
                    type="number"
                    min="1"
                    name={`rewards.${idx}.rank`}
                    value={r.rank}
                    onChange={(e) => handleRewardChange(idx, 'rank', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 ${errors[`rewards.${idx}.rank`] ? 'border-rose-500' : 'border-primary-700/30'}`}
                    placeholder="1"
                  />
                  {errors[`rewards.${idx}.rank`] && <p className="text-xs text-rose-400 mt-1">{errors[`rewards.${idx}.rank`]}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-300 mb-1 block">Số tiền (ETH)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    name={`rewards.${idx}.reward_amount`}
                    value={r.reward_amount}
                    onChange={(e) => handleRewardChange(idx, 'reward_amount', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 ${errors[`rewards.${idx}.reward_amount`] ? 'border-rose-500' : 'border-primary-700/30'}`}
                    placeholder="0.01"
                  />
                  {errors[`rewards.${idx}.reward_amount`] && <p className="text-xs text-rose-400 mt-1">{errors[`rewards.${idx}.reward_amount`]}</p>}
                </div>

                <button 
                  type="button" 
                  onClick={() => handleRemoveReward(idx)} 
                  className="mt-6 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-500/30"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
          <button 
            type="button" 
            onClick={handleAddReward} 
            className="mt-4 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors border border-cyan-500/30"
          >
            + Thêm phần thưởng
          </button>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-primary-700/20">
          <Button type="button" variant="ghost" size="md" onClick={handleReset} disabled={loading}>
            Làm mới
          </Button>
          {onCancel && (
            <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={loading}>
              Hủy
            </Button>
          )}
          <Button type="submit" variant="primary" size="md" loading={loading} disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo giải đấu'}
          </Button>
        </div>
      </form>
    </div>
  );
}
