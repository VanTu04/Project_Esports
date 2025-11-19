import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import rewardService from '../../services/rewardService';

export default function EditTournamentForm({ initialData = {}, onSave, onCancel, saving = false }) {
  const toDateTimeLocal = (value) => {
    if (!value) return '';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const min = pad(d.getMinutes());
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    } catch (e) {
      return '';
    }
  };

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

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || initialData.tournament_name || '',
        total_rounds: initialData.total_rounds ?? initialData.totalRounds ?? 3,
        expected_teams: initialData.expected_teams ?? initialData.expectedTeams ?? '',
        start_date: toDateTimeLocal(initialData.start_date || initialData.start_time),
        end_date: toDateTimeLocal(initialData.end_date || initialData.end_time),
        description: initialData.description || initialData.desc || '',
        rewards: initialData.rewards || [],
        registration_fee: initialData.registration_fee ?? initialData.registrationFee ?? '',
      });

      (async () => {
        try {
          const hasRewards = Array.isArray(initialData.rewards) && initialData.rewards.length > 0;
          const tournamentId = initialData.id ?? initialData.tournament_id ?? initialData.tournamentId;
          if (!hasRewards && tournamentId) {
            const r = await rewardService.getTournamentRewards(tournamentId);
            const payload = r?.data ?? r;
            let rewardsArray = [];
            if (Array.isArray(payload)) rewardsArray = payload;
            else if (Array.isArray(payload?.data)) rewardsArray = payload.data;

            if (rewardsArray.length > 0) {
              setForm(prev => ({ ...prev, rewards: rewardsArray }));
            }
          }
        } catch (e) {
          console.debug('Could not fetch tournament rewards for edit form:', e?.message || e);
        }
      })();
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const c = { ...prev }; delete c[name]; return c; });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name || !form.name.trim()) newErrors.name = 'Tên giải đấu không được để trống';
    const rounds = Number(form.total_rounds);
    if (!rounds || rounds < 1) newErrors.total_rounds = 'Số vòng phải >= 1';
    if (!form.start_date) newErrors.start_date = 'Chọn ngày bắt đầu';
    if (!form.end_date) newErrors.end_date = 'Chọn ngày kết thúc';
    if (form.start_date && form.end_date) {
      const s = new Date(form.start_date);
      const e = new Date(form.end_date);
      if (s >= e) newErrors.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    if (form.registration_fee && isNaN(Number(form.registration_fee))) newErrors.registration_fee = 'Phí đăng ký không hợp lệ';

    (form.rewards || []).forEach((r, idx) => {
      if (!r || r.rank === '' || isNaN(Number(r.rank))) newErrors[`rewards.${idx}.rank`] = 'Hạng không hợp lệ';
      if (r.reward_amount === '' || isNaN(Number(r.reward_amount))) newErrors[`rewards.${idx}.reward_amount`] = 'Số tiền không hợp lệ';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      total_rounds: Number(form.total_rounds),
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      expected_teams: form.expected_teams ? Number(form.expected_teams) : undefined,
      description: form.description || undefined,
      registration_fee: form.registration_fee !== '' ? Number(form.registration_fee) : undefined,
      rewards: Array.isArray(form.rewards) ? form.rewards.map(r => ({ rank: Number(r.rank), reward_amount: Number(r.reward_amount) })) : undefined,
    };

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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 w-full">
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

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Ngày bắt đầu <span className="text-rose-400">*</span></label>
          <input
            type="datetime-local"
            name="start_date"
            value={form.start_date || ''}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.start_date ? 'border-rose-500' : 'border-primary-700/30'}`}
          />
          {errors.start_date && <p className="text-xs text-rose-400 mt-1">{errors.start_date}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Ngày kết thúc <span className="text-rose-400">*</span></label>
          <input
            type="datetime-local"
            name="end_date"
            value={form.end_date || ''}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.end_date ? 'border-rose-500' : 'border-primary-700/30'}`}
          />
          {errors.end_date && <p className="text-xs text-rose-400 mt-1">{errors.end_date}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">Số vòng đấu <span className="text-rose-400">*</span></label>
        <input
          type="number"
          min="1"
          name="total_rounds"
          value={form.total_rounds}
          onChange={handleChange}
          className={`w-32 px-4 py-2.5 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.total_rounds ? 'border-rose-500' : 'border-primary-700/30'}`}
        />
        {errors.total_rounds && <p className="text-xs text-rose-400 mt-1">{errors.total_rounds}</p>}
        <p className="text-xs text-gray-400 mt-1">Số vòng đấu trong giải (1-20 vòng)</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">Phí đăng ký tham gia (ETH)</label>
        <input
          name="registration_fee"
          type="number"
          min="0"
          step="0.0001"
          value={form.registration_fee}
          onChange={handleChange}
          className={`w-40 px-4 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.registration_fee ? 'border-rose-500' : 'border-primary-700/30'}`}
          placeholder="Nhập số ETH cần để đăng ký (ví dụ: 0.01)"
        />
        {errors.registration_fee && <p className="text-xs text-rose-400 mt-1">{errors.registration_fee}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">Mô tả giải đấu</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows="4"
          maxLength={1000}
          className={`w-full px-4 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.description ? 'border-rose-500' : 'border-primary-700/30'}`}
          placeholder="Nhập mô tả chi tiết về giải đấu: thể thức, giải thưởng, quy định..."
        />
        {errors.description && <p className="text-xs text-rose-400 mt-1">{errors.description}</p>}
        <p className="text-xs text-gray-400 mt-1">{(form.description || '').length}/1000 ký tự</p>
      </div>

      <div>
        <label className="block text-sm text-gray-300">Phần thưởng</label>
        <div className="space-y-2 mt-2">
          {(form.rewards || []).map((r, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-3 items-end">
              <div>
                <label className="text-xs text-gray-300">Hạng</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Hạng"
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
                  placeholder="Số tiền"
                  value={r.reward_amount}
                  onChange={(e) => handleRewardChange(idx, 'reward_amount', e.target.value)}
                  className={`w-full px-3 py-2 rounded border bg-white text-gray-900 ${errors[`rewards.${idx}.reward_amount`] ? 'border-rose-500' : 'border-primary-700/30'}`}
                />
                {errors[`rewards.${idx}.reward_amount`] && <p className="text-xs text-rose-400">{errors[`rewards.${idx}.reward_amount`]}</p>}
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => removeReward(idx)} className="text-sm text-rose-400 hover:underline">Xóa</button>
              </div>
            </div>
          ))}

          <div>
            <button type="button" onClick={addReward} className="text-cyan-400">+ Thêm phần thưởng</button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>Hủy</Button>
        <Button variant="primary" loading={saving} type="submit">Lưu thay đổi</Button>
      </div>
    </form>
  );
}
