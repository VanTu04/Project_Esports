import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/userService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import OtpModal from '../../components/common/OtpModal';
import { useNotification } from '../../context/NotificationContext';

export default function TwoFactorSetup() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [passwordForDisableAll, setPasswordForDisableAll] = useState('');

  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrSecret, setQrSecret] = useState(null);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpMode, setOtpMode] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const p = await userService.getProfile();
      setProfile(p || {});
    } catch (err) {
      console.error('loadProfile', err);
    }
  }

  // Đếm số phương thức đang hoạt động
  const getActiveMethodsCount = () => {
    let count = 0;
    if (profile?.totp_secret) count++;
    if (profile?.email_two_factor_enabled) count++;
    return count;
  };

  const isLastMethod = getActiveMethodsCount() === 1;

  async function startTotp(password) {
    try {
      setLoading(true);
      const res = await userService.startTotp(password);
      setQrData(res.qr || null);
      setQrSecret(res.secret || null);
      setShowPasswordModal(false);
      setShowQrModal(true);
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || err?.message || 'Không thể bắt đầu TOTP');
    } finally {
      setLoading(false);
    }
  }

  async function confirmTotp(token) {
    try {
      if (!token || token.length !== 6) {
        return showError('Vui lòng nhập mã 6 chữ số');
      }
      setLoading(true);
      await userService.confirmTotp(token);
      showSuccess('TOTP đã được bật');
      setShowOtpModal(false);
      setPasswordValue('');
      await loadProfile();
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || err?.message || 'Xác thực TOTP thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function startEmailEnable(password) {
    try {
      setLoading(true);
      await userService.startTwoFactorEnable(password);
      showSuccess('Mã OTP đã được gửi tới email của bạn');
      setShowPasswordModal(false);
      setOtpMode('email-enable');
      setShowOtpModal(true);
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || err?.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  }

  async function confirmEmailEnable(token) {
    try {
      if (!token || token.length !== 6) {
        return showError('Vui lòng nhập mã 6 chữ số');
      }
      setLoading(true);
      await userService.confirmTwoFactorEnable(token);
      showSuccess('Email 2FA đã được bật');
      setShowOtpModal(false);
      setPasswordValue('');
      await loadProfile();
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || err?.message || 'Xác thực OTP thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function disableEmail(password) {
    try {
      setLoading(true);
      // GỌI ĐÚNG API: disableEmailByPassword - KHÔNG gửi OTP
      await userService.disableEmailByPassword(password);
      showSuccess('Email 2FA đã được tắt');
      setShowPasswordModal(false);
      setPasswordValue('');
      await loadProfile();
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || err?.message || 'Lỗi tắt Email 2FA');
    } finally {
      setLoading(false);
    }
  }

  async function disableTotp(password) {
    try {
      setLoading(true);
      // GỌI ĐÚNG API: disableTotpByPassword - KHÔNG gửi OTP
      await userService.disableTotpByPassword(password);
      showSuccess('TOTP đã được tắt');
      setShowPasswordModal(false);
      setPasswordValue('');
      await loadProfile();
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || err?.message || 'Lỗi tắt TOTP');
    } finally {
      setLoading(false);
    }
  }

  async function disableAllWithToken(token) {
    try {
      if (!passwordForDisableAll) {
        return showError('Vui lòng nhập mật khẩu trước');
      }
      if (!token || token.length !== 6) {
        return showError('Vui lòng nhập mã 6 chữ số');
      }
      setLoading(true);
      // API này sẽ verify mã OTP từ phương thức đang có (TOTP hoặc Email OTP trong DB)
      // KHÔNG gửi email mới
      await userService.disableAllTwoFactor(passwordForDisableAll, token);
      showSuccess('Tắt toàn bộ 2FA thành công');
      setShowOtpModal(false);
      setPasswordValue('');
      setPasswordForDisableAll('');
      await loadProfile();
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || err?.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  }

  // Xử lý khi click nút Tắt của từng phương thức
  const handleDisableMethod = (method) => {
    if (isLastMethod) {
      // Phương thức cuối cùng - cần xác thực kép (password + OTP)
      // Nhưng KHÔNG tự động gửi OTP, user phải có sẵn OTP từ phương thức hiện tại
      setOtpMode('disable-all-password');
      setShowPasswordModal(true);
    } else {
      // Còn nhiều phương thức - chỉ cần password, không cần OTP
      if (method === 'totp') {
        setOtpMode('disable-totp-password');
      } else {
        setOtpMode('disable-email-password');
      }
      setShowPasswordModal(true);
    }
  };

  // Password modal confirm handler
  const handlePasswordConfirm = async () => {
    if (!passwordValue) {
      return showError('Vui lòng nhập mật khẩu');
    }

    try {
      setLoading(true);

      if (otpMode === 'email-enable-password') {
        await startEmailEnable(passwordValue);
      } else if (otpMode === 'totp-setup-password') {
        await startTotp(passwordValue);
      } else if (otpMode === 'disable-email-password') {
        // Tắt Email (còn phương thức khác) - chỉ cần password
        await disableEmail(passwordValue);
      } else if (otpMode === 'disable-totp-password') {
        // Tắt TOTP (còn phương thức khác) - chỉ cần password
        await disableTotp(passwordValue);
      } else if (otpMode === 'disable-all-password') {
        // Tắt phương thức cuối cùng - cần password + OTP
        // Lưu password; keep the password modal open while we perform any async send so user sees loading
        setPasswordForDisableAll(passwordValue);
        // Start loading state so the button shows spinner
        setLoading(true);

        try {
          // If the only active method is Email (no TOTP), send email OTP automatically (disable-specific endpoint)
          if (profile?.email_two_factor_enabled && !profile?.totp_secret) {
            await userService.startTwoFactorDisable(passwordValue);
            showSuccess('Mã OTP đã được gửi tới email của bạn để xác nhận tắt 2FA');
          }

          // Move to OTP entry step (open OTP modal) after the send (or immediately when TOTP exists)
          setOtpMode('disable-all');
          setShowOtpModal(true);
          // close password modal and clear password after we launched the OTP step
          setShowPasswordModal(false);
          setPasswordValue('');
        } catch (err) {
          console.error(err);
          showError(err?.response?.data?.message || err?.message || 'Không thể gửi mã OTP để tắt 2FA');
        } finally {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || err?.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header với nút quay lại */}
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(-1)}
          >
            ← Quay lại
          </Button>
        </div>

        <div className="bg-white/5 rounded p-6 flex items-start gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">Xác minh 2 bước</h1>
            <p className="text-sm text-gray-300 mt-2">
              Quản lý phương thức xác thực 2 bước (2FA). 
              {profile?.two_factor_enabled && (
                <span className="ml-2 text-green-400">
                  Đang dùng: {getActiveMethodsCount()}/2 phương thức
                </span>
              )}
            </p>
          </div>
          
          {/* Nút tắt toàn bộ 2FA */}
          {profile?.two_factor_enabled && getActiveMethodsCount() > 0 && (
            <div>
              <Button
                variant="danger"
                onClick={() => {
                  setOtpMode('disable-all-password');
                  setShowPasswordModal(true);
                }}
              >
                Tắt toàn bộ 2FA
              </Button>
            </div>
          )}
        </div>

        <Card padding="lg">
          <h3 className="text-lg font-semibold text-white mb-4">Bước thứ hai</h3>
          <div className="space-y-3">
            {/* TOTP / Authenticator */}
            <div className="flex items-center justify-between p-4 rounded border bg-white/3">
              <div>
                <div className="text-white">Authenticator</div>
                <div className="text-sm text-gray-400">
                  Ứng dụng Authenticator (Google Authenticator, Authy)
                </div>
              </div>
              <div className="flex items-center gap-2">
                {profile?.totp_secret ? (
                  <>
                    <span className="text-sm text-green-400">Đã kích hoạt</span>
                    <Button
                      variant={isLastMethod ? 'danger' : 'outline'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDisableMethod('totp');
                      }}
                    >
                      {isLastMethod ? '⚠️ Tắt (Cuối cùng)' : 'Tắt'}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setOtpMode('totp-setup-password');
                      setShowPasswordModal(true);
                    }}
                  >
                    Thiết lập
                  </Button>
                )}
              </div>
            </div>

            {/* Email OTP */}
            <div className="flex items-center justify-between p-4 rounded border bg-white/3">
              <div>
                <div className="text-white">Email</div>
                <div className="text-sm text-gray-400">Nhận mã OTP qua email</div>
              </div>
              <div className="flex items-center gap-2">
                {profile?.email_two_factor_enabled ? (
                  <>
                    <span className="text-sm text-green-400">Đã kích hoạt</span>
                    <Button
                      variant={isLastMethod ? 'danger' : 'outline'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDisableMethod('email');
                      }}
                    >
                      {isLastMethod ? '⚠️ Tắt (Cuối cùng)' : 'Tắt'}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setOtpMode('email-enable-password');
                      setShowPasswordModal(true);
                    }}
                  >
                    Thiết lập
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Password Modal */}
        <Modal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setPasswordValue('');
          }}
          title={
            otpMode === 'disable-all-password'
              ? '⚠️ Tắt hoàn toàn 2FA'
              : 'Xác nhận mật khẩu'
          }
          size="sm"
        >
          <div className="space-y-4">
            {otpMode === 'disable-all-password' && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
                <p className="text-sm text-red-400 font-semibold">
                  ⚠️ Cảnh báo nghiêm trọng
                </p>
                <ul className="text-xs text-red-300 mt-2 space-y-1 list-disc list-inside">
                  <li>Tất cả phương thức 2FA sẽ bị tắt</li>
                  <li>Backup codes sẽ không còn sử dụng được</li>
                  <li>Tài khoản của bạn sẽ ít an toàn hơn</li>
                </ul>
                {getActiveMethodsCount() > 1 && (
                  <p className="text-xs text-red-200 mt-2">
                    Bạn có {getActiveMethodsCount()} phương thức đang hoạt động. Tất cả sẽ bị vô hiệu hóa.
                  </p>
                )}
              </div>
            )}
            
            <p className="text-sm text-gray-300">
              Nhập mật khẩu hiện tại để xác nhận hành động.
            </p>
            
            <input
              type="password"
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              placeholder="Mật khẩu hiện tại"
              className="w-full px-3 py-2 bg-dark-400 text-white rounded border border-white/20 focus:border-white focus:outline-none"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handlePasswordConfirm();
              }}
            />
            
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordValue('');
                }}
              >
                Hủy
              </Button>
              <Button
                variant={otpMode === 'disable-all-password' ? 'danger' : 'primary'}
                loading={loading}
                onClick={handlePasswordConfirm}
              >
                {otpMode === 'disable-all-password' ? 'Tiếp tục tắt' : 'Xác nhận'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* QR Modal */}
        <Modal
          isOpen={showQrModal}
          onClose={() => {
            setShowQrModal(false);
            setQrData(null);
            setQrSecret(null);
          }}
          title="Quét mã QR"
          size="sm"
        >
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-300">
              Quét mã QR bằng ứng dụng Authenticator
            </p>
            
            {qrData ? (
              <img src={qrData} alt="QR Code" className="mx-auto max-w-xs" />
            ) : (
              <p className="text-sm text-gray-400">
                Mã secret: <code className="bg-dark-400 px-2 py-1 rounded">{qrSecret}</code>
              </p>
            )}
            
            <div className="flex justify-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowQrModal(false);
                  setQrData(null);
                  setQrSecret(null);
                }}
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowQrModal(false);
                  setOtpMode('setup');
                  setShowOtpModal(true);
                }}
              >
                Nhập mã xác thực
              </Button>
            </div>
          </div>
        </Modal>

        {/* OTP Modal */}
        <OtpModal
          isOpen={showOtpModal}
          onClose={() => {
            setShowOtpModal(false);
            setPasswordForDisableAll('');
          }}
          title={
            otpMode === 'setup'
              ? 'Xác nhận mã TOTP'
              : otpMode === 'email-enable'
              ? 'Nhập mã OTP (Email)'
              : otpMode === 'disable-all'
              ? '⚠️ Xác nhận tắt 2FA'
              : 'Nhập mã OTP'
          }
          message={
            otpMode === 'disable-all'
              ? `Nhập mã OTP ${
                  profile?.totp_secret && profile?.email_two_factor_enabled
                    ? 'từ Authenticator app HOẶC kiểm tra email của bạn'
                    : profile?.totp_secret
                    ? 'từ Authenticator app'
                    : 'đã được gửi tới email của bạn trước đó (nếu chưa có, bạn cần yêu cầu gửi lại)'
                } để xác nhận tắt toàn bộ 2FA.`
              : undefined
          }
          loading={loading}
          onConfirm={async (token) => {
            if (otpMode === 'setup') {
              return confirmTotp(token);
            }
            if (otpMode === 'email-enable') {
              return confirmEmailEnable(token);
            }
            if (otpMode === 'disable-all') {
              return disableAllWithToken(token);
            }
            return null;
          }}
          onResend={
            otpMode === 'email-enable'
                    ? () => startEmailEnable(passwordValue)
              : otpMode === 'disable-all' && profile?.email_two_factor_enabled && !profile?.totp_secret
              ? async () => {
                  // Chỉ cho phép gửi lại nếu CHỈ có Email 2FA (không có TOTP)
                  try {
                    setLoading(true);
                    await userService.startTwoFactorDisable(passwordForDisableAll);
                    showSuccess('Mã OTP đã được gửi lại tới email của bạn');
                  } catch (err) {
                    showError(err?.response?.data?.message || err?.message || 'Lỗi gửi OTP');
                  } finally {
                    setLoading(false);
                  }
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}