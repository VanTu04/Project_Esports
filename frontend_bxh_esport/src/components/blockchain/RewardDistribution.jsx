import { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';

export const RewardDistribution = ({ rewards, onDistribute }) => {
  const [selectedReward, setSelectedReward] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [distributing, setDistributing] = useState(false);

  const handleDistribute = async () => {
    setDistributing(true);
    try {
      await onDistribute(selectedReward);
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setDistributing(false);
    }
  };

  if (!rewards || rewards.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Không có phần thưởng nào cần phân phối
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {rewards.map((reward) => (
          <Card key={reward.id}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">
                  {reward.tournamentName}
                </h4>
                <p className="text-sm text-gray-400">
                  {reward.recipientType === 'team' ? 'Đội: ' : 'Player: '}
                  {reward.recipientName}
                </p>
                <p className="text-lg font-bold text-primary-500 mt-2">
                  {reward.amount} {reward.currency}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {reward.distributed ? (
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="text-sm">Đã phân phối</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      setSelectedReward(reward);
                      setIsModalOpen(true);
                    }}
                  >
                    Phân phối
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Xác nhận phân phối phần thưởng"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleDistribute} loading={distributing}>
              Xác nhận
            </Button>
          </div>
        }
      >
        {selectedReward && (
          <div className="space-y-3">
            <p className="text-gray-300">
              Bạn sắp phân phối phần thưởng:
            </p>
            <div className="bg-dark-300 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Giải đấu:</span>
                <span className="text-white font-medium">
                  {selectedReward.tournamentName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Người nhận:</span>
                <span className="text-white font-medium">
                  {selectedReward.recipientName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Số tiền:</span>
                <span className="text-primary-500 font-bold text-lg">
                  {selectedReward.amount} {selectedReward.currency}
                </span>
              </div>
            </div>
            <p className="text-sm text-yellow-500">
              ⚠️ Giao dịch này sẽ được ghi lên blockchain và không thể hoàn tác
            </p>
          </div>
        )}
      </Modal>
    </>
  );
};