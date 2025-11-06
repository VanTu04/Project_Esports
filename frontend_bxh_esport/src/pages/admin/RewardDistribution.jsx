import { useEffect, useState } from 'react';
import rewardService from '../../services/rewardService';
import { RewardDistribution as RewardDistComp } from '../../components/blockchain/RewardDistribution';
import { useNotification } from '../../context/NotificationContext';

export const RewardDistribution = () => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const data = await rewardService.getPendingRewards();
      setRewards(data.rewards || []);
    } catch (error) {
      showError('Không thể tải danh sách phần thưởng');
    } finally {
      setLoading(false);
    }
  };

  const handleDistribute = async (rewardId) => {
    try {
      await rewardService.executeRewardDistribution(rewardId);
      showSuccess('Phân phối phần thưởng thành công');
      loadRewards();
    } catch (error) {
      showError('Không thể phân phối phần thưởng');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Phân phối phần thưởng</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <RewardDistComp rewards={rewards} onDistribute={handleDistribute} />
      )}
    </div>
  );
};