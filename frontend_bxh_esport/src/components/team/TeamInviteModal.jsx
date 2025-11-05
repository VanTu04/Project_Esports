import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export const TeamInviteModal = ({ isOpen, onClose, onInvite }) => {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onInvite(userId);
      setUserId('');
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mời thành viên"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Gửi lời mời
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          User ID hoặc Email
        </label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Nhập user ID hoặc email"
          className="w-full px-4 py-2 bg-dark-400 border border-primary-700/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
        />
      </form>
    </Modal>
  );
};
