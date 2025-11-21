import { useEffect, useState } from 'react';
import userService from '../../services/userService';
import { useNotification } from '../../context/NotificationContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function Settings() {
  const { showSuccess, showError } = useNotification();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);

  // change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [saving2fa, setSaving2fa] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await userService.getProfile();
      setProfile(data);
      setTwoFactorEnabled(Boolean(data.two_factor_enabled));
    } catch (err) {
      console.error(err);
      showError('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!currentPassword || !newPassword) {
      showError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Mật khẩu mới và xác nhận không trùng');
      return;
    }

    try {
      setLoading(true);
      await userService.changePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showSuccess('Đổi mật khẩu thành công');
      setShowChangeModal(false);
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này? Hành động không thể hoàn tác.')) return;
    try {
      setLoading(true);
      await userService.deleteAccount();
      showSuccess('Tài khoản đã được xóa');
      // Redirect to home page or login
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || 'Xóa tài khoản thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      setSaving2fa(true);
      await userService.setTwoFactor(!twoFactorEnabled);
      setTwoFactorEnabled((s) => !s);
      showSuccess(`Xác thực 2 yếu tố đã ${!twoFactorEnabled ? 'bật' : 'tắt'}`);
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || 'Cập nhật 2FA thất bại');
    } finally {
      setSaving2fa(false);
    }
  };

  const refreshBalance = async () => {
    await loadProfile();
    showSuccess('Đã làm mới số dư');
  };

  if (!profile) {
    return <div className="text-gray-400">Đang tải cài đặt...</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Cài đặt</h1>
          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="lg" className="shadow">
            <div role="button" tabIndex={0} className="flex items-center justify-between cursor-pointer" onClick={() => setShowChangeModal(true)} onKeyDown={() => setShowChangeModal(true)}>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Đổi mật khẩu</h3>
                <p className="text-sm text-gray-300">Thay đổi mật khẩu đăng nhập của bạn</p>
              </div>
              <div className="text-gray-400">›</div>
            </div>
          </Card>

          <Card padding="lg" className="shadow">
            <h3 className="text-lg font-semibold text-white mb-4">Xác thực 2 yếu tố</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Sử dụng 2FA để tăng bảo mật tài khoản của bạn.</p>
                <p className="text-xs text-gray-500">Khi bật, bạn cần mã xác thực mỗi lần đăng nhập.</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-sm text-white">{twoFactorEnabled ? 'Đã bật' : 'Đã tắt'}</div>
                <Button variant={twoFactorEnabled ? 'danger' : 'primary'} size="sm" loading={saving2fa} onClick={handleToggle2FA}>
                  {twoFactorEnabled ? 'Tắt 2FA' : 'Bật 2FA'}
                </Button>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="shadow md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Xóa tài khoản</h3>
                <p className="text-sm text-gray-300">Xóa vĩnh viễn tài khoản và mọi dữ liệu liên quan. Hành động không thể hoàn tác.</p>
              </div>
              <div>
                <Button variant="danger" loading={loading} onClick={handleDeleteAccount}>Xóa tài khoản</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
        <Modal
          isOpen={showChangeModal}
          onClose={() => setShowChangeModal(false)}
          title="Đổi mật khẩu"
          size="md"
          footer={(
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowChangeModal(false)}>Hủy</Button>
              <Button variant="primary" loading={loading} onClick={() => handleChangePassword()}>Lưu</Button>
            </div>
          )}
        >
          <form className="space-y-3" onSubmit={handleChangePassword}>
            <input type="password" placeholder="Mật khẩu hiện tại" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded" />
            <input type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded" />
            <input type="password" placeholder="Xác nhận mật khẩu mới" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded" />
          </form>
        </Modal>
      </div>
  );
}
