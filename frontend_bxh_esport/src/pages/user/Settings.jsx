import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/userService';
import { validatePassword } from '../../utils/validators';
import { useNotification } from '../../context/NotificationContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function Settings() {
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);

  // change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA
  const [saving2fa, setSaving2fa] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [totpQr, setTotpQr] = useState(null);
  const [totpSecret, setTotpSecret] = useState(null);
  const [totpToken, setTotpToken] = useState('');
  const [showChoose2FAModal, setShowChoose2FAModal] = useState(false);
  const [twoFactorOtp, setTwoFactorOtp] = useState('');
  const [twoFactorDigits, setTwoFactorDigits] = useState(new Array(6).fill(''));
  const otpInputsRef = [];
  const [twoFactorFlow, setTwoFactorFlow] = useState(null); // 'enable' or 'disable'
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await userService.getProfile();
      setProfile(data);
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

    if (!validatePassword(newPassword)) {
      showError('Mật khẩu phải có ít nhất 8 ký tự, gồm chữ in hoa, chữ thường, số và ký tự đặc biệt');
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

  const handleStartEnable2FA = async () => {
    // open password confirm modal first
    setTwoFactorFlow('enable');
    setShowPasswordModal(true);
    setPasswordConfirm('');
  };

  const handleStartDisable2FA = async () => {
    // open password confirm modal first
    setTwoFactorFlow('disable');
    setShowPasswordModal(true);
    setPasswordConfirm('');
  };

  const handleStartTotpSetup = async () => {
    try {
      setSaving2fa(true);
      const res = await userService.startTotp();
      // res expected { qr, secret }
      setTotpQr(res.qr || null);
      setTotpSecret(res.secret || null);
      setShowTotpSetup(true);
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || err?.message || 'Không thể bắt đầu TOTP');
    } finally {
      setSaving2fa(false);
    }
  };

  const handleConfirmTotpSetup = async () => {
    try {
      setSaving2fa(true);
      await userService.confirmTotp(totpToken);
      showSuccess('TOTP đã được bật');
      setShowTotpSetup(false);
      setTotpQr(null);
      setTotpSecret(null);
      setTotpToken('');
      await loadProfile();
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || err?.message || 'Xác thực TOTP thất bại');
    } finally {
      setSaving2fa(false);
    }
  };

  const handleConfirmPassword = async () => {
    try {
      setPasswordLoading(true);
      if (twoFactorFlow === 'enable') {
        await userService.startTwoFactorEnable(passwordConfirm);
        // open OTP modal for enable flow
        setShowPasswordModal(false);
        setShow2FAModal(true);
        showSuccess('Mã OTP đã được gửi tới email của bạn. Vui lòng kiểm tra email.');
      } else {
        // disable via password only (no OTP required)
        await userService.disableTwoFactorByPassword(passwordConfirm);
        showSuccess('Xác thực 2 bước đã được tắt');
        setShowPasswordModal(false);
        await loadProfile();
      }
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || 'Xác thực mật khẩu thất bại');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleConfirmTwoFactor = async () => {
    try {
      setTwoFactorLoading(true);
      const otp = twoFactorDigits.join('');
      if (otp.length < 6) {
        throw new Error('Vui lòng nhập đủ 6 chữ số OTP');
      }
      if (twoFactorFlow === 'enable') {
        await userService.confirmTwoFactorEnable(otp);
        showSuccess('Xác minh 2 bước đã được bật');
      } else if (twoFactorFlow === 'disable') {
        await userService.confirmTwoFactorDisable(otp);
        showSuccess('Xác minh 2 bước đã được tắt');
      }
      setShow2FAModal(false);
      setTwoFactorOtp('');
      setTwoFactorDigits(new Array(6).fill(''));
      setTwoFactorFlow(null);
      // refresh profile to sync server state
      await loadProfile();
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || 'Xác thực OTP thất bại');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const focusOtpInput = (index) => {
    const ref = otpInputsRef[index];
    if (ref && ref.focus) ref.focus();
  };

  const handleOtpChange = (index, value) => {
    const v = value.replace(/[^0-9]/g, '');
    if (!v && value !== '') return; // ignore non-digit
    const digits = [...twoFactorDigits];
    digits[index] = v ? v.charAt(v.length - 1) : '';
    setTwoFactorDigits(digits);
    if (v) {
      // move to next
      if (index < 5) focusOtpInput(index + 1);
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (twoFactorDigits[index]) {
        const digits = [...twoFactorDigits];
        digits[index] = '';
        setTwoFactorDigits(digits);
      } else if (index > 0) {
        focusOtpInput(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusOtpInput(index - 1);
    } else if (e.key === 'ArrowRight' && index < 5) {
      focusOtpInput(index + 1);
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
    if (!paste) return;
    const chars = paste.split('').slice(0, 6);
    const digits = new Array(6).fill('');
    for (let i = 0; i < chars.length; i++) digits[i] = chars[i];
    setTwoFactorDigits(digits);
    const nextIndex = Math.min(chars.length, 5);
    focusOtpInput(nextIndex);
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
            <div role="button" tabIndex={0} className="flex items-center justify-between cursor-pointer" onClick={() => navigate('/settings/2fa')} onKeyDown={() => navigate('/settings/2fa')}>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Xác minh 2 bước</h3>
                <p className="text-sm text-gray-300">Sử dụng 2FA để tăng bảo mật tài khoản của bạn.</p>
                <p className="text-xs text-gray-500">Khi bật, bạn cần mã xác thực mỗi lần đăng nhập.</p>
              </div>
              <div className="text-gray-400">›</div>
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
            {/* PasswordRequirements removed per request */}
            <input type="password" placeholder="Xác nhận mật khẩu mới" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded" />
          </form>
        </Modal>
        <Modal
          isOpen={show2FAModal}
          onClose={() => { setShow2FAModal(false); setTwoFactorOtp(''); setTwoFactorFlow(null); }}
          title={twoFactorFlow === 'enable' ? 'Xác nhận bật 2FA' : 'Xác nhận tắt 2FA'}
          size="sm"
          footer={(
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setShow2FAModal(false); setTwoFactorOtp(''); setTwoFactorFlow(null); }}>Hủy</Button>
              <Button variant="primary" loading={twoFactorLoading} onClick={handleConfirmTwoFactor}>Xác nhận</Button>
            </div>
          )}
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-300">Chúng tôi đã gửi mã OTP tới email của bạn. Nhập mã để xác nhận.</p>
            <div className="flex gap-2 justify-center">
              {twoFactorDigits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { otpInputsRef[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(e, i)}
                  onPaste={handleOtpPaste}
                  className="w-12 h-12 text-center text-lg rounded border bg-white text-black"
                />
              ))}
            </div>
          </div>
        </Modal>
        <Modal
          isOpen={showTotpSetup}
          onClose={() => { setShowTotpSetup(false); setTotpQr(null); setTotpSecret(null); setTotpToken(''); }}
          title="Bật TOTP (Authenticator App)"
          size="md"
          footer={(
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setShowTotpSetup(false); setTotpQr(null); setTotpSecret(null); setTotpToken(''); }}>Hủy</Button>
              <Button variant="primary" loading={saving2fa} onClick={handleConfirmTotpSetup}>Xác nhận</Button>
            </div>
          )}
        >
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-300">Quét mã QR bằng ứng dụng Authenticator (Google Authenticator, Authy...).</p>
            {totpQr ? (
              <img src={totpQr} alt="TOTP QR" className="mx-auto" />
            ) : (
              <p className="text-sm text-gray-400">Không thể hiển thị QR. Bạn có thể nhập mã thủ công: <code className="text-xs">{totpSecret}</code></p>
            )}
            <div>
              <input value={totpToken} onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, '').slice(0,6))} placeholder="Nhập mã 6 chữ số" className="w-40 px-3 py-2 text-center mx-auto block" />
            </div>
            <p className="text-xs text-gray-500">Sau khi bật, bạn có thể lưu mã backup để khôi phục nếu mất điện thoại.</p>
          </div>
        </Modal>
        <Modal
          isOpen={showPasswordModal}
          onClose={() => { setShowPasswordModal(false); setPasswordConfirm(''); setTwoFactorFlow(null); }}
          title={twoFactorFlow === 'enable' ? 'Xác nhận mật khẩu để bật 2FA' : 'Xác nhận mật khẩu để tắt 2FA'}
          size="sm"
          footer={(
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setShowPasswordModal(false); setPasswordConfirm(''); setTwoFactorFlow(null); }}>Hủy</Button>
              <Button variant="primary" loading={passwordLoading} onClick={handleConfirmPassword}>Tiếp tục</Button>
            </div>
          )}
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-300">Vui lòng nhập mật khẩu hiện tại để xác nhận hành động.</p>
            <input type="password" placeholder="Mật khẩu hiện tại" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded" />
          </div>
        </Modal>
      </div>
  );
}
