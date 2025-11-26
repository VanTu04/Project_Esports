import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { apiClient } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { useNotification } from '../../context/NotificationContext';
import Button from '../common/Button';
import { Loading } from '../common/Loading';

export default function CreateTournamentForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({
    name: '',
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
  const { showSuccess, showError } = useNotification();
  const [startDateObj, setStartDateObj] = useState(form.start_date ? new Date(form.start_date) : null);
  const [endDateObj, setEndDateObj] = useState(form.end_date ? new Date(form.end_date) : null);

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

    const rounds = parseInt(form.total_rounds);
    if (!rounds || rounds < 1) {
      newErrors.total_rounds = 'Số vòng đấu phải lớn hơn 0';
    } else if (rounds > 20) {
      newErrors.total_rounds = 'Số vòng đấu không được quá 20';
    }

    // Validate expected teams (optional)
    if (form.expected_teams) {
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

    // Validate rewards if present
    if (Array.isArray(form.rewards) && form.rewards.length > 0) {
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

    // Validate registration fee
    if (form.registration_fee !== '') {
      const fee = Number(form.registration_fee);
      if (isNaN(fee) || fee < 0) {
        newErrors.registration_fee = 'Phí đăng ký phải là số ETH >= 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  

  // Compute Swiss-system recommended min/max participants for given rounds
  // Assumptions:
  // - To reliably determine a clear winner in Swiss, a conservative upper bound is 2^rounds.
  // - A practical minimum is rounds + 1 (so teams can be paired across rounds without extreme repetition).
  const computeSwissBounds = (rounds) => {
    const r = Number(rounds) || 0;
    const maxTeams = Math.pow(2, r);
    const minTeams = Math.max(2, r + 1);
    return { minTeams, maxTeams };
  };

  // Rewards handlers
  const handleAddReward = () => {
    setForm(prev => ({ ...prev, rewards: [...(prev.rewards || []), { rank: '', reward_amount: '' }] }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Vui lòng kiểm tra lại thông tin');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        total_rounds: parseInt(form.total_rounds),
        start_date: form.start_date,
        end_date: form.end_date,
        // Backend requires `total_team` to be provided and non-falsy.
        // If admin left the "Số đội dự kiến" empty, default to 2 to satisfy backend validation.
        total_team: form.expected_teams ? parseInt(form.expected_teams) : 2,
        description: form.description.trim() || undefined,
        registration_fee: form.registration_fee !== '' ? Number(form.registration_fee) : 1,
        rewards: Array.isArray(form.rewards) && form.rewards.length > 0 ? form.rewards.map(r => ({ rank: Number(r.rank), reward_amount: Number(r.reward_amount) })) : undefined,
      };

      const response = await apiClient.post(API_ENDPOINTS.TOURNAMENTS, payload);

      if (response.success || response.data) {
        showSuccess(response.message || 'Tạo giải đấu thành công!');
        setForm({
          name: '',
          total_rounds: 3,
            expected_teams: '',
            start_date: '',
            end_date: '',
            description: '',
            rewards: [],
        });
        setErrors({});

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
      total_rounds: 3,
      expected_teams: '',
      start_date: '',
      end_date: '',
      description: '',
      rewards: [],
      registration_fee: '',
    });
    setErrors({});
  };

  return (
    <div className="w-full">
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
          {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
          <p className="text-xs text-gray-400 mt-1">{form.name.length}/100 ký tự</p>
        </div>

        {/* Phí đăng ký tham gia (ETH) */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Phí đăng ký tham gia (ETH)
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
            placeholder="Nhập số ETH cần để đăng ký (ví dụ: 0.01)"
          />
          {errors.registration_fee && (
            <p className="text-xs text-rose-400 mt-1">{errors.registration_fee}</p>
          )}
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

          {/* Swiss-system bounds info */}
          <div className="mt-2 text-sm text-gray-300">
            {(() => {
              const { minTeams, maxTeams } = computeSwissBounds(form.total_rounds);
              return (
                <>
                  <div>Gợi ý cho chế độ Thụy Sĩ: tối thiểu <strong>{minTeams}</strong> đội, tối đa khuyến nghị <strong>{maxTeams}</strong> đội (dựa trên {form.total_rounds} vòng).</div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Số đội tham gia */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Số đội tham gia
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
          
          {/* Show notification inline if expected_teams is outside recommended bounds */}
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

        {/* Ngày bắt đầu và kết thúc */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                // If current end date is before newly chosen start date, clear end date
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

        {/* Phần thưởng (Rewards) */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Phần thưởng</label>
          <div className="space-y-2">
            {(form.rewards || []).map((r, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-xs text-gray-300">Hạng</label>
                  <input
                    type="number"
                    min="1"
                    name={`rewards.${idx}.rank`}
                    value={r.rank}
                    onChange={(e) => handleRewardChange(idx, 'rank', e.target.value)}
                    className={`w-full px-3 py-2 rounded border bg-white text-gray-900 ${errors[`rewards.${idx}.rank`] ? 'border-rose-500' : 'border-primary-700/30'}`}
                  />
                  {errors[`rewards.${idx}.rank`] && <p className="text-xs text-rose-400">{errors[`rewards.${idx}.rank`]}</p>}
                </div>

                <div>
                  <label className="text-xs text-gray-300">Số tiền</label>
                  <input
                    type="number"
                    min="0"
                    name={`rewards.${idx}.reward_amount`}
                    value={r.reward_amount}
                    onChange={(e) => handleRewardChange(idx, 'reward_amount', e.target.value)}
                    className={`w-full px-3 py-2 rounded border bg-white text-gray-900 ${errors[`rewards.${idx}.reward_amount`] ? 'border-rose-500' : 'border-primary-700/30'}`}
                  />
                  {errors[`rewards.${idx}.reward_amount`] && <p className="text-xs text-rose-400">{errors[`rewards.${idx}.reward_amount`]}</p>}
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handleRemoveReward(idx)} className="text-sm text-rose-400 hover:underline">Xóa</button>
                </div>
              </div>
            ))}

            <div>
              <button type="button" onClick={handleAddReward} className="text-sm text-cyan-400 hover:underline">+ Thêm phần thưởng</button>
            </div>
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
          {errors.description && <p className="text-xs text-rose-400 mt-1">{errors.description}</p>}
          <p className="text-xs text-gray-400 mt-1">{form.description.length}/1000 ký tự</p>
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
