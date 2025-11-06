import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';
import Button from './Button';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'warning', // warning, danger, info
  loading = false,
}) => {
  const iconColors = {
    warning: 'text-yellow-500',
    danger: 'text-red-500',
    info: 'text-blue-500',
  };

  const handleConfirm = async () => {
    await onConfirm();
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={false}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={type === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 ${iconColors[type]}`}
        >
          <ExclamationTriangleIcon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-gray-300">{message}</p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;