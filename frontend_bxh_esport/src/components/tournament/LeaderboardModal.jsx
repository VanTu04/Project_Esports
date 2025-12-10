import { useEffect, useState } from 'react';
import { Card } from '../common/Card';
import Button from '../common/Button';
import tournamentService from '../../services/tournamentService';
import { formatETH } from '../../utils/formatters';
import rewardService from '../../services/rewardService';
import { apiClient } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { useNotification } from '../../context/NotificationContext';
import { /*TrophyIcon*/ } from '@heroicons/react/24/solid';
import { resolveTeamLogo } from '../../utils/imageHelpers';
import LeaderboardTable from './LeaderboardTable';

export const LeaderboardModal = ({
  show,
  onClose,
  tournamentId,
  leaderboard,
  onDistributeSuccess,
}) => {
  const { showError, showSuccess } = useNotification();
  const [localLeaderboard, setLocalLeaderboard] = useState(leaderboard || []);
  const [loading, setLoading] = useState(false);
  const [rewardsMap, setRewardsMap] = useState({});
  const [distributing, setDistributing] = useState(false);
  const [distributionsMap, setDistributionsMap] = useState({});
  const [totalRewardNeeded, setTotalRewardNeeded] = useState(0);
  const [isDistributed, setIsDistributed] = useState(false);
  const [contractBalance, setContractBalance] = useState(0);

  useEffect(() => {
    const fetchFinalLeaderboard = async () => {
      if (!show || !tournamentId) return;
      setLoading(true);
      try {
        const resp = await tournamentService.getFinalLeaderboard(tournamentId);
        let dataArr = [];
        if (resp?.code === 0 && resp?.data?.leaderboard && Array.isArray(resp.data.leaderboard)) {
          dataArr = resp.data.leaderboard;
        } else if (resp?.data && Array.isArray(resp.data)) {
          dataArr = resp.data;
        } else if (Array.isArray(resp)) {
          dataArr = resp;
        } else if (resp?.leaderboard && Array.isArray(resp.leaderboard)) {
          dataArr = resp.leaderboard;
        }

        // Fetch rewards
        let rMap = {};
        let totalReward = 0;
        try {
          const rResp = await rewardService.getTournamentRewards(tournamentId);
          let rData = [];
          if (rResp?.code === 0 && Array.isArray(rResp.data)) rData = rResp.data;
          else if (Array.isArray(rResp)) rData = rResp;

          rData.forEach(r => {
            if (r.rank != null) {
              rMap[Number(r.rank)] = r.reward_amount;
              totalReward += parseFloat(r.reward_amount || 0);
            }
          });
          setRewardsMap(rMap);
          setTotalRewardNeeded(totalReward);
        } catch (e) {
          console.debug('No rewards or failed fetch:', e);
        }

        // Fetch distributions
        try {
          const dResp = await tournamentService.getDistributions(tournamentId);
          let dData = [];
          if (dResp?.code === 0 && Array.isArray(dResp.data)) dData = dResp.data;
          else if (Array.isArray(dResp)) dData = dResp;

          const dMap = {};
          (dData || []).forEach(d => {
            const rk = Number(d.rank);
            if (!dMap[rk]) dMap[rk] = d;
          });
          setDistributionsMap(dMap);
        } catch (e) {
          console.debug('Failed to fetch distributions:', e);
        }

        // Fetch tournament details to check whether rewards already distributed
        try {
          const tResp = await tournamentService.getTournamentById(tournamentId);
          const payload = tResp?.data ?? tResp;
          const distributedFlag = payload?.reward_distributed ?? payload?.data?.reward_distributed ?? null;
          setIsDistributed(Number(distributedFlag) === 1);
        } catch (e) {
          console.debug('Failed to fetch tournament details:', e);
        }

        // Fetch contract balance and address
        // Fetch contract balance
        try {
          const balanceResp = await apiClient.get(`${API_ENDPOINTS.DISTRIBUTE_REWARDS}/contract-balance`);
          const balanceData = balanceResp?.data?.data ?? balanceResp?.data ?? balanceResp;
          setContractBalance(balanceData?.balance ?? 0);
        } catch (e) {
          console.debug('Failed to fetch contract balance:', e);
        }
        // Normalize leaderboard — provide fields expected by LeaderboardTable
        const normalized = (dataArr || []).map((item, idx) => {
          const teamName = item.team_name ?? item.name ?? item.username ?? item.fullname ?? `Team ${idx + 1}`;
          const avatar = item.avatar ?? resolveTeamLogo(item) ?? null;
          const totalMatches = item.totalMatches ?? item.total_matches ?? item.total_match ?? item.matches ?? item.total ?? 0;
          const buchholzScore = item.buchholzScore ?? item.buchholz_score ?? item.buchholz ?? 0;
          const sonnebornBerger = item.sonnebornBerger ?? item.sonneborn_berger ?? item.sb ?? 0;

          return {
            id: item.userId ?? item.wallet ?? item.id ?? item.team_id ?? `t${idx}`,
            name: teamName,
            username: item.username ?? item.userName ?? null,
            wallet: item.wallet ?? null,
            userId: item.userId ?? null,
            avatar,
            // keep legacy `logo` for other components
            logo: avatar,
            wins: item.wins ?? item.wins_count ?? 0,
            losses: item.losses ?? 0,
            draws: item.draws ?? 0,
            // normalize score field expected by LeaderboardTable
            points: Number(item.score ?? item.points ?? 0),
            score: Number(item.score ?? item.points ?? 0),
            reward: (rMap ? rMap[idx + 1] : null),
            totalMatches: Number(totalMatches || 0),
            buchholzScore: Number(buchholzScore || 0),
            sonnebornBerger: Number(sonnebornBerger || 0),
            team: { logo: avatar, name: teamName }
          };
        });

        // Attach reward
        const withRewards = normalized.map((row, i) => ({
          ...row,
          reward: (rMap ? rMap[i + 1] : (rewardsMap[i + 1] ?? row.reward)) ?? null
        }));

        setLocalLeaderboard(withRewards);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        showError('Không thể tải bảng xếp hạng từ blockchain.');
        setLocalLeaderboard(leaderboard || []);
      } finally {
        setLoading(false);
      }
    };

    fetchFinalLeaderboard();
  }, [show, tournamentId]);

  // Handle distribute & auto-fund
  const handleDistributeRewards = async () => {
    if (!tournamentId) return showError('Thiếu tournamentId');
    setDistributing(true);

    try {
      // Directly call distribute endpoint. Backend will auto-fund if needed
      // and create TransactionHistory for FUND_CONTRACT inside the distribution flow.
      const resp = await apiClient.post(API_ENDPOINTS.DISTRIBUTE_REWARDS, { tournament_id: Number(tournamentId) });
      if (resp?.code === 0 || resp?.data?.code === 0) {
        const data = resp?.data?.data || resp?.data || resp;
        const distributionsCount = data?.total_distributed || data?.distributions?.length || 0;
        showSuccess(`Phân phối thành công ${distributionsCount} giải thưởng!`);

        // Reload distributions
        const dResp = await tournamentService.getDistributions(tournamentId);
        let dData = [];
        if (dResp?.code === 0 && Array.isArray(dResp.data)) dData = dResp.data;
        else if (Array.isArray(dResp)) dData = dResp;

        const dMap = {};
        (dData || []).forEach(d => {
          const rk = Number(d.rank);
          if (!dMap[rk]) dMap[rk] = d;
        });
        setDistributionsMap(dMap);

        // Reload tournaments list if callback provided
        if (onDistributeSuccess) {
          await onDistributeSuccess();
        }

        // Close modal after successful distribution
        onClose();
      } else {
        const errorMsg = resp?.message || resp?.data?.message || 'Phân phối thất bại';
        showError(errorMsg);
      }

    } catch (err) {
      console.error('Distribute error', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Phân phối thất bại';

      // Detect owner-only on-chain revert (CALL_EXCEPTION / require)
      const msgLower = String(errorMsg).toLowerCase();
      const isOwnerRevert = msgLower.includes('call_exception') || msgLower.includes('require(false)') || msgLower.includes('revert') || msgLower.includes('require');

      if (isOwnerRevert) {
        // Attempt server-wallet fallback endpoint
        try {
          showError('Phân phối on-chain thất bại (có thể do yêu cầu owner-only). Đang thử phân phối bằng ví server (fallback)...');
          const fwResp = await apiClient.post(`${API_ENDPOINTS.WALLET}/distribute-rewards`, { idTournament: Number(tournamentId) });

          if (fwResp?.code === 0 || fwResp?.data?.code === 0) {
            showSuccess('Phân phối bằng ví server thành công (fallback).');

            // Reload distributions
            try {
              const dResp = await tournamentService.getDistributions(tournamentId);
              let dData = [];
              if (dResp?.code === 0 && Array.isArray(dResp.data)) dData = dResp.data;
              else if (Array.isArray(dResp)) dData = dResp;

              const dMap = {};
              (dData || []).forEach(d => {
                const rk = Number(d.rank);
                if (!dMap[rk]) dMap[rk] = d;
              });
              setDistributionsMap(dMap);
            } catch (e) {
              console.debug('Failed to reload distributions after fallback:', e);
            }

            // Reload tournaments list if callback provided
            if (onDistributeSuccess) {
              await onDistributeSuccess();
            }

            // Close modal after successful fallback distribution
            onClose();
          } else {
            const fwErr = fwResp?.message || fwResp?.data?.message || 'Fallback thất bại';
            showError(fwErr);
          }
        } catch (fe) {
          console.error('Fallback error', fe);
          const fwMsg = fe?.response?.data?.message || fe?.message || 'Fallback phân phối thất bại';
          showError(fwMsg);
        }
      } else {
        showError(errorMsg);
      }

    } finally {
      setDistributing(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="relative max-w-[1200px] w-[95vw] max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="p-6 border-b border-primary-700/20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">Bảng xếp hạng Giải {tournamentId}</h2>
            {isDistributed && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Đã phân phối giải thưởng
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl transition-colors">×</button>
        </div>

          <div className="p-6 space-y-6 pb-6">
          {/* Contract Info Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg p-4 border border-amber-500/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-amber-300 font-medium mb-1">💰 Số dư Contract</p>
                <p className="text-lg text-white font-bold">
                  {formatETH(contractBalance)} ETH
                </p>
              </div>
              <div>
                <p className="text-xs text-amber-300 font-medium mb-1">🏆 Tổng giải thưởng cần</p>
                <p className="text-lg text-white font-bold">
                  {formatETH(totalRewardNeeded)} ETH
                </p>
              </div>
            </div>
          </div>

          {/* Use shared LeaderboardTable for consistent display */}
          <div>
            <LeaderboardTable data={localLeaderboard} loading={loading} rewards={distributionsMap} />
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center border-t border-primary-700/20 pt-4 gap-3">
            {!isDistributed && (
              <button
                onClick={handleDistributeRewards}
                className={`px-4 py-2 rounded font-semibold transition-colors bg-amber-600 text-black hover:bg-amber-700`}
                disabled={distributing}
              >
                {distributing ? 'Đang xử lý...' : '🏆 Phân phối giải thưởng'}
              </button>
            )}
            {/* If distribute button is visible, show Close in footer aligned right; otherwise keep floating Close at bottom-right */}
            <Button variant="secondary" onClick={onClose}>Đóng</Button>
          </div>

          {/* Floating Close button removed per request */}
        </div>
      </Card>
    </div>
  );
};
