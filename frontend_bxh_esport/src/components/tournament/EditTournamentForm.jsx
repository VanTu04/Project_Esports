import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Button from '../common/Button';
import rewardService from '../../services/rewardService';
import { getActiveGames } from '../../services/gameService';
import { useNotification } from '../../context/NotificationContext';
import { normalizeImageUrl } from '../../utils/imageHelpers';

export default function EditTournamentForm({ initialData = {}, onSave, onCancel, saving = false }) {
  const { showSuccess, showError } = useNotification();
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

  const [errors, setErrors] = useState({});
  const [games, setGames] = useState([]);
  const [startDateObj, setStartDateObj] = useState(null);
  const [endDateObj, setEndDateObj] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [deleteImage, setDeleteImage] = useState(false);

  // Load active games on mount
  useEffect(() => {
    const loadGames = async () => {
      try {
        console.log('🎮 Loading active games...');
        const response = await getActiveGames();
        console.log('🎮 Games response:', response);
        
        let gamesData = [];
        if (response?.data?.data && Array.isArray(response.data.data)) {
          gamesData = response.data.data;
        } else if (Array.isArray(response?.data)) {
          gamesData = response.data;
        } else if (Array.isArray(response)) {
          gamesData = response;
        }
        
        console.log('🎮 Parsed games data:', gamesData);
        setGames(gamesData);
      } catch (error) {
        console.error('❌ Error loading games:', error);
        showError('Không thể tải danh sách game');
        setGames([]);
      }
    };
    loadGames();
  }, []);

  useEffect(() => {
    if (initialData) {
      console.log('📝 EditTournamentForm - initialData:', initialData);
      
      const parseISOToLocal = (d) => {
        if (!d) return null;
        const p = String(d).split('-').map(Number);
        return p.length === 3 ? new Date(p[0], p[1] - 1, p[2]) : new Date(d);
      };

      const startDate = initialData.start_date || initialData.start_time;
      const endDate = initialData.end_date || initialData.end_time;

      // Parse total_team correctly
      const expectedTeams = initialData.total_team ?? initialData.expected_teams ?? initialData.expectedTeams ?? '';

      const formData = {
        name: initialData.name || initialData.tournament_name || '',
        game_id: initialData.game_id ?? initialData.gameId ?? '',
        total_rounds: initialData.total_rounds ?? initialData.totalRounds ?? 3,
        expected_teams: expectedTeams,
        start_date: startDate ? startDate.split('T')[0] : '',
        end_date: endDate ? endDate.split('T')[0] : '',
        description: initialData.description || initialData.desc || '',
        rewards: initialData.rewards || [],
        registration_fee: initialData.registration_fee ?? initialData.registrationFee ?? '',
      };

      console.log('📝 Setting form data:', formData);
      setForm(formData);

      setStartDateObj(startDate ? parseISOToLocal(startDate.split('T')[0]) : null);
      setEndDateObj(endDate ? parseISOToLocal(endDate.split('T')[0]) : null);

      // load image preview if initial data contains an image url
      const imageUrl = initialData.image || initialData.image_url || initialData.img || initialData.logo || null;
      if (imageUrl) {
        // Use normalizeImageUrl to construct full URL
        const fullImageUrl = normalizeImageUrl(imageUrl);
        console.log('🖼️ Loading image preview:', fullImageUrl);
        setImagePreview(fullImageUrl);
        setOriginalImageUrl(imageUrl); // Store original URL
        setDeleteImage(false);
      }

      (async () => {
        try {
          const hasRewards = Array.isArray(initialData.rewards) && initialData.rewards.length > 0;
          const tournamentId = initialData.id ?? initialData.tournament_id ?? initialData.tournamentId;
          if (!hasRewards && tournamentId) {
            console.log('🎁 Fetching rewards for tournament:', tournamentId);
            const r = await rewardService.getTournamentRewards(tournamentId);
            const payload = r?.data ?? r;
            let rewardsArray = [];
            if (Array.isArray(payload)) rewardsArray = payload;
            else if (Array.isArray(payload?.data)) rewardsArray = payload.data;

            console.log('🎁 Loaded rewards:', rewardsArray);
            if (rewardsArray.length > 0) {
              setForm(prev => ({ ...prev, rewards: rewardsArray }));
            }
          } else {
            console.log('🎁 Using rewards from initialData:', initialData.rewards);
          }
        } catch (e) {
          console.debug('Could not fetch tournament rewards for edit form:', e?.message || e);
        }
      })();
    }
  }, [initialData]);

  // image handlers
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setDeleteImage(true); // Mark for deletion
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const c = { ...prev }; delete c[name]; return c; });
  };

  const computeSwissBounds = (rounds) => {
    const r = Number(rounds) || 0;
    const maxTeams = Math.pow(2, r);
    const minTeams = Math.max(2, r + 1);
    return { minTeams, maxTeams };
  };

  const validate = () => {
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

    const rounds = Number(form.total_rounds);
    if (!rounds || rounds < 1) {
      newErrors.total_rounds = 'Số vòng phải >= 1';
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

    if (!form.start_date) newErrors.start_date = 'Chọn ngày bắt đầu';
    if (!form.end_date) newErrors.end_date = 'Chọn ngày kết thúc';
    
    if (form.start_date && form.end_date) {
      const s = new Date(form.start_date);
      const e = new Date(form.end_date);
      if (e < s) newErrors.end_date = 'Ngày kết thúc không được trước ngày bắt đầu';
    }

    if (form.description && form.description.trim().length > 1000) {
      newErrors.description = 'Mô tả không được quá 1000 ký tự';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      showError('Vui lòng kiểm tra lại thông tin');
      return;
    }
    const payload = {
      name: form.name.trim(),
      game_id: form.game_id ? parseInt(form.game_id) : undefined,
      total_rounds: Number(form.total_rounds),
      start_date: form.start_date,
      end_date: form.end_date,
      total_team: form.expected_teams ? parseInt(form.expected_teams) : undefined,
      description: form.description.trim() || undefined,
      registration_fee: form.registration_fee !== '' ? Number(form.registration_fee) : undefined,
      rewards: Array.isArray(form.rewards) && form.rewards.length > 0 ? form.rewards.map(r => ({ rank: Number(r.rank), reward_amount: Number(r.reward_amount) })) : undefined,
    };

    // If user uploaded new image, send FormData
    if (imageFile) {
      const fd = new FormData();
      Object.keys(payload).forEach((k) => {
        if (typeof payload[k] !== 'undefined' && payload[k] !== null) {
          if (k === 'rewards') {
            fd.append('rewards', JSON.stringify(payload.rewards));
          } else {
            fd.append(k, String(payload[k]));
          }
        }
      });
      fd.append('image', imageFile);
      console.log('📤 Sending with new image file');
      onSave && onSave(fd);
      return;
    }

    // If user wants to delete image, mark it in payload
    if (deleteImage) {
      payload.delete_image = true;
      console.log('🗑️ Marking image for deletion');
    } else if (originalImageUrl && !imageFile) {
      // Keep the original image URL if no new image and not deleting
      payload.image = originalImageUrl;
      console.log('🖼️ Keeping original image:', originalImageUrl);
    }

    console.log('📤 Sending payload:', payload);
    onSave && onSave(payload);
  };

  const handleRewardChange = (idx, field, value) => {
    setForm(prev => {
      const rewards = Array.isArray(prev.rewards) ? [...prev.rewards] : [];
      rewards[idx] = { ...rewards[idx], [field]: value };
      return { ...prev, rewards };
    });
    setErrors(prev => { const c = { ...prev }; delete c[`rewards.${idx}.${field}`]; return c; });
  };

  const addReward = () => setForm(prev => ({ ...prev, rewards: [...(prev.rewards || []), { rank: '', reward_amount: '' }] }));
  const removeReward = (idx) => setForm(prev => ({ ...prev, rewards: (prev.rewards || []).filter((_, i) => i !== idx) }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Tên giải đấu <span className="text-rose-400">*</span></label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.name ? 'border-rose-500' : 'border-primary-700/30'}`}
              placeholder="Ví dụ: Giải Esports Mùa Xuân 2025"
              maxLength={100}
            />
            {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
            <p className="text-xs text-gray-400 mt-1">{(form.name || '').length}/100 ký tự</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Game <span className="text-rose-400">*</span></label>
            <select
              name="game_id"
              value={form.game_id || ''}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.game_id ? 'border-rose-500' : 'border-primary-700/30'}`}
            >
              <option value="">-- Chọn game --</option>
              {games.map(game => (
                <option key={game.id} value={game.id}>{game.game_name}</option>
              ))}
            </select>
            {errors.game_id && <p className="text-xs text-rose-400 mt-1">{errors.game_id}</p>}
            <p className="text-xs text-gray-400 mt-1">Chọn game cho giải đấu (chỉ hiển thị game đang hoạt động)</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Số vòng đấu <span className="text-rose-400">*</span></label>
            <input
              type="number"
              min="1"
              max="20"
              name="total_rounds"
              value={form.total_rounds}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.total_rounds ? 'border-rose-500' : 'border-primary-700/30'}`}
            />
            {errors.total_rounds && <p className="text-xs text-rose-400 mt-1">{errors.total_rounds}</p>}
            <p className="text-xs text-gray-400 mt-1">Số vòng đấu trong giải (1-20 vòng)</p>
            <div className="mt-2 text-sm text-gray-300">
              {(() => {
                const { minTeams, maxTeams } = computeSwissBounds(form.total_rounds);
                return (
                  <div>Gợi ý cho chế độ Thụy Sĩ: tối thiểu <strong>{minTeams}</strong> đội, tối đa khuyến nghị <strong>{maxTeams}</strong> đội (dựa trên {form.total_rounds} vòng).</div>
                );
              })()}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Số đội tham gia <span className="text-rose-400">*</span></label>
            <input
              name="expected_teams"
              type="number"
              min="1"
              value={form.expected_teams || ''}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.expected_teams ? 'border-rose-500' : 'border-primary-700/30'}`}
            />
            {errors.expected_teams && <p className="text-xs text-rose-400 mt-1">{errors.expected_teams}</p>}
            {form.expected_teams && (() => {
              const t = parseInt(form.expected_teams);
              const { minTeams, maxTeams } = computeSwissBounds(form.total_rounds);
              if (!t) return null;
              if (t < minTeams) {
                return <p className="text-xs text-amber-300 mt-1">Số đội {t} nhỏ hơn tối thiểu khuyến nghị {minTeams} cho {form.total_rounds} vòng. Bạn nên giảm số vòng hoặc thêm đội.</p>;
              }
              if (t > maxTeams) {
                return <p className="text-xs text-amber-300 mt-1">Số đội {t} lớn hơn tối đa khuyến nghị {maxTeams} cho {form.total_rounds} vòng. Xem xét tăng số vòng để phân định thứ hạng tốt hơn.</p>;
              }
              return <p className="text-xs text-green-400 mt-1">Số đội {t} nằm trong khoảng khuyến nghị.</p>;
            })()}
          </div>

          {/* Ngày bắt đầu & Ngày kết thúc - 1 hàng */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Ngày bắt đầu <span className="text-rose-400">*</span></label>
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
              <label className="block text-sm font-semibold text-white mb-2">Ngày kết thúc <span className="text-rose-400">*</span></label>
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
            <label className="block text-sm font-semibold text-white mb-2">Phí đăng ký tham gia (ETH) <span className="text-rose-400">*</span></label>
            <input
              name="registration_fee"
              type="number"
              min="0"
              step="0.0001"
              value={form.registration_fee || ''}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.registration_fee ? 'border-rose-500' : 'border-primary-700/30'}`}
              placeholder="Nhập số ETH cần để đăng ký (ví dụ: 0.01)"
            />
            {errors.registration_fee && <p className="text-xs text-rose-400 mt-1">{errors.registration_fee}</p>}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Ảnh giải đấu</label>
            <div className="flex flex-col gap-3">
              {imagePreview && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-primary-500">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
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

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Mô tả giải đấu</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="10"
              maxLength={1000}
              className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none ${errors.description ? 'border-rose-500' : 'border-primary-700/30'}`}
              placeholder="Nhập mô tả chi tiết về giải đấu: thể thức, giải thưởng, quy định..."
            />
            {errors.description && <p className="text-xs text-rose-400 mt-1">{errors.description}</p>}
            <p className="text-xs text-gray-400 mt-1">{(form.description || '').length}/1000 ký tự</p>
          </div>
        </div>
      </div>

      {/* Phần thưởng (Rewards) - full width */}
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
                onClick={() => removeReward(idx)} 
                className="mt-6 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-500/30"
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
        <button 
          type="button" 
          onClick={addReward} 
          className="mt-4 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors border border-cyan-500/30"
        >
          + Thêm phần thưởng
        </button>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-primary-700/20">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>Hủy</Button>
        <Button variant="primary" loading={saving} type="submit" disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  );
}
