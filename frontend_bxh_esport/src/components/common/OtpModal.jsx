import { useEffect, useState } from 'react';
import Modal from './Modal';
import Button from './Button';

const OtpModal = ({ isOpen, onClose, title = 'Nhập mã OTP', message, loading, onConfirm, onResend, resendLabel = 'Gửi lại mã' }) => {
  const [digits, setDigits] = useState(new Array(6).fill(''));
  const otpInputsRef = [];

  useEffect(() => {
    if (!isOpen) {
      setDigits(new Array(6).fill(''));
    }
  }, [isOpen]);

  const focusOtpInput = (index) => {
    const ref = otpInputsRef[index];
    if (ref && ref.focus) ref.focus();
  };

  const handleOtpChange = (index, value) => {
    const v = value.replace(/[^0-9]/g, '');
    const newDigits = [...digits];
    newDigits[index] = v ? v.charAt(v.length - 1) : '';
    setDigits(newDigits);
    if (v && index < 5) focusOtpInput(index + 1);
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
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
    const newDigits = new Array(6).fill('');
    for (let i = 0; i < chars.length; i++) newDigits[i] = chars[i];
    setDigits(newDigits);
    const nextIndex = Math.min(chars.length, 5);
    focusOtpInput(nextIndex);
  };

  const handleConfirm = () => {
    const otp = digits.join('');
    if (otp.length < 6) return;
    onConfirm(otp);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={(
        <div className="flex justify-between items-center w-full">
          <div>
            {onResend && (
              <button type="button" className="text-sm text-primary-500 hover:underline" onClick={onResend} disabled={loading}>
                {resendLabel}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Hủy</Button>
            <Button variant="primary" loading={loading} onClick={handleConfirm}>Xác nhận</Button>
          </div>
        </div>
      )}
    >
      <div className="space-y-3">
        {message && <p className="text-sm text-gray-300">{message}</p>}
        <div className="flex gap-2 justify-center">
          {digits.map((d, i) => (
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
  );
};

export default OtpModal;
