import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import blockchainService from '../../services/blockchainService';
import { useNotification } from '../../context/NotificationContext';
import Button from '../../components/common/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../../components/common/Card';

// Inline icons (copied from provided design)
const PencilIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CameraIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

export function UserProfile() {
  const { updateUser } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Normalize various possible shapes returned from /wallet/balance
  const normalizeBalance = (resp) => {
    const payload = resp?.data ?? resp;
    if (payload === null || payload === undefined) return null;
    // common shapes: { data: { balance } } or { balance } or raw number/string
    if (typeof payload === 'number' || typeof payload === 'string') return payload;
    if (payload?.data && (typeof payload.data === 'number' || typeof payload.data === 'string')) return payload.data;
    if (payload?.data && payload.data.balance !== undefined) return payload.data.balance;
    if (payload.balance !== undefined) return payload.balance;
    // nested wrapper like { success, message, data: { balance } }
    if (payload.data && typeof payload.data === 'object') {
      if (payload.data.balance !== undefined) return payload.data.balance;
      if (payload.data.data && payload.data.data.balance !== undefined) return payload.data.data.balance;
    }
    return null;
  };
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await userService.getProfile();
        // Normalize common axios wrapper shapes: { code, data: { ... } } or { data: {...} } or direct object
        const wrapper = data?.data ?? data;
        const profilePayload = wrapper?.data ?? wrapper ?? null;
        // set profile data first
        setProfile(profilePayload);
        // then try to fetch fresh wallet balance
        try {
          await fetchBalance();
        } catch (e) {
          console.warn('Could not fetch wallet balance:', e);
        }
      } catch (err) {
        console.error(err);
        showError('Không thể tải profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Fetch balance helper: try blockchainService first, then userService as fallback.
  const fetchBalance = async () => {
    try {
      const resp = await blockchainService.getMyWalletBalance();
      // Match admin page extraction: resp.data.data.balanceEth
      const balanceEth = resp?.data?.data?.balanceEth ?? null;
      if (balanceEth !== null && balanceEth !== undefined) {
        setProfile((p) => ({ ...(p || {}), balance: balanceEth }));
        return balanceEth;
      }
      // fallback to other shapes
      const bal = normalizeBalance(resp);
      if (bal !== null && bal !== undefined) {
        setProfile((p) => ({ ...(p || {}), balance: bal }));
        return bal;
      }
    } catch (e) {
      // ignore and try fallback
    }

    try {
      const resp2 = await userService.getWalletBalance();
      const bal2 = normalizeBalance(resp2);
      if (bal2 !== null && bal2 !== undefined) {
        setProfile((p) => ({ ...(p || {}), balance: bal2 }));
        return bal2;
      }
    } catch (e) {
      // final fallback: do nothing
    }

    return null;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setProfile((p) => ({ ...(p || {}), avatar: url }));
    }
  };

  const handleChange = (field) => (e) => {
    setProfile((p) => ({ ...(p || {}), [field]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await userService.updateProfileForm({ full_name: profile.full_name, phone: profile.phone }, avatarFile);
      const updated = await userService.getProfile();
      // Normalize shapes like in load(): support axios wrappers
      const wrapper = updated?.data ?? updated;
      const profilePayload = wrapper?.data ?? wrapper ?? null;
      // Preserve previous balance if the returned payload doesn't include it
      setProfile(prev => ({ ...(profilePayload || {}), balance: (profilePayload && profilePayload.balance !== undefined) ? profilePayload.balance : prev?.balance }));
      updateUser(profilePayload || updated);
      setEditing(false);
      setAvatarFile(null);
      showSuccess('Cập nhật hồ sơ thành công');
    } catch (err) {
      console.error(err);
      showError('Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <div className="text-gray-400">Đang tải...</div>;
  }

  // Ensure balance is a primitive (string/number) for rendering to avoid
  // "Objects are not valid as a React child" errors if API returned
  // a full payload object like { success, message, data }.
  const displayBalance = (() => {
    const b = profile.balance;
    if (b === null || b === undefined) return '0.0';
    if (typeof b === 'number' || typeof b === 'string') return b;
    // if it's an object, try common shapes
    if (typeof b === 'object') {
      if (b.balance !== undefined) return b.balance;
      if (b.data && b.data.balance !== undefined) return b.data.balance;
      // fallback to stringified short form
      try {
        return String(b);
      } catch (e) {
        return '0.0';
      }
    }
    return String(b);
  })();

  const displayRewards = (() => {
    const r = profile.rewards;
    if (r === null || r === undefined) return '0.0';
    if (typeof r === 'number' || typeof r === 'string') return r;
    if (typeof r === 'object') {
      if (r.rewards !== undefined && (typeof r.rewards === 'number' || typeof r.rewards === 'string')) return r.rewards;
      if (r.data !== undefined && (typeof r.data === 'number' || typeof r.data === 'string')) return r.data;
      try { return String(r); } catch (e) { return '0.0'; }
    }
    return String(r);
  })();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white">
              Hồ sơ của tôi
            </h1>
            <p className="text-gray-400 mt-1">Quản lý thông tin cá nhân của bạn</p>
          </div>

          <div className="flex items-center gap-3">
            {!editing ? (
              <Button leftIcon={<PencilIcon />} onClick={() => setEditing(true)}>
                Chỉnh sửa
              </Button>
            ) : (
              <Button leftIcon={<CheckIcon />} variant="success" loading={loading} onClick={handleSave}>
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card padding="lg" className="shadow-xl">
              <div className="flex flex-col items-center">
                <div className="relative group mb-4">
                  <div className="w-40 h-40 rounded-full overflow-hidden ring-4 ring-cyan-500/30 shadow-lg">
                    <img src={profile.avatar || '/default-avatar.png'} alt={profile.username} className="w-full h-full object-cover" />
                  </div>

                  <input id="avatar-input" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

                  {editing && (
                    <label htmlFor="avatar-input" className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer rounded-full">
                      <CameraIcon />
                      <span className="sr-only">Thay đổi ảnh đại diện</span>
                    </label>
                  )}

                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-gray-800 shadow-lg"></div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-1">{profile.full_name}</h2>
                <p className="text-cyan-400 text-sm mb-4">@{profile.username}</p>

                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">Đang hoạt động</span>
                </div>
              </div>
            </Card>

            {/* Thống kê removed per request */}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card padding="lg" className="shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
               
                Thông tin cá nhân
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <UserIcon />
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile(p => ({...p, full_name: e.target.value}))}
                    readOnly={!editing}
                    className={`w-full px-4 py-3 bg-gray-900/50 border rounded-lg text-white placeholder-gray-500 transition-all duration-200 ${editing ? 'border-cyan-500/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20' : 'border-gray-700/50'}`}
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <PhoneIcon />
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile(p => ({...p, phone: e.target.value}))}
                    readOnly={!editing}
                    className={`w-full px-4 py-3 bg-gray-900/50 border rounded-lg text-white placeholder-gray-500 transition-all duration-200 ${editing ? 'border-cyan-500/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20' : 'border-gray-700/50'}`}
                    placeholder="Số điện thoại"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <EmailIcon />
                    Email
                  </label>
                  <div className="px-4 py-3 bg-gray-900/30 border border-gray-700/50 rounded-lg text-gray-400 flex items-center gap-2">
                    {profile.email}
                  </div>
                </div>
              </div>
            </Card>

            <Card padding="lg" className="shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <WalletIcon />
                Thông tin ví
              </h3>

              <div className="space-y-4">
                <div className="md:col-span-2 p-5 rounded-lg border border-primary-500/10 bg-gradient-to-b from-primary-700/5 to-dark-600">
                  <label className="text-sm font-medium text-gray-200 mb-2 block">Địa chỉ ví</label>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 font-mono text-sm break-all text-white">{profile.wallet_address || profile.wallet || ''}</code>
                    <Button variant="secondary" size="sm" className="flex-shrink-0" onClick={() => profile.wallet_address && navigator.clipboard.writeText(profile.wallet_address || profile.wallet)} title="Copy địa chỉ">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    <p className="text-sm text-gray-400 mb-1">Số dư</p>
                    <p className="text-2xl font-bold text-white">{displayBalance ?? '0.0'} ETH</p>
                  </div>

                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    <p className="text-sm text-gray-400 mb-1">Tổng thưởng</p>
                    <p className="text-2xl font-bold text-green-400">{displayRewards ?? '0.0'} ETH</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Settings removed from profile - moved to dedicated Settings page */}
          </div>
        </div>
      </div>
    </div>
  );
}

// keep default for existing default imports
export default UserProfile;
