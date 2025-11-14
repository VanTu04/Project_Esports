import models from '../models/index.js';
import { getLeaderboardFromChain, distributeRewardOnChain } from '../services/BlockchainService.js';
import { responseSuccess, responseWithError } from '../response/ResponseSuccess.js';
import { ErrorCodes } from '../constant/ErrorCodes.js';

/**
 * Admin phân phối giải thưởng dựa trên BXH cuối cùng
 * POST /api/tournaments/:tournament_id/distribute-rewards
 */
export const distributeTournamentRewards = async (req, res) => {
  try {
    const { tournament_id } = req.params;

    // 1. Lấy giải đấu
    const tournament = await models.Tournament.findByPk(tournament_id);
    if (!tournament) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại.'));
    }
    if (tournament.status !== 'COMPLETED') {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Chỉ có thể phân phối cho giải đấu đã kết thúc.'));
    }

    // 2. Lấy danh sách reward từ DB
    const rewards = await models.TournamentReward.findAll({
      where: { tournament_id },
      order: [['rank', 'ASC']] // Top 1 trước
    });
    if (!rewards || rewards.length === 0) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Chưa có cấu hình reward cho giải đấu.'));
    }

    // 3. Lấy BXH vòng cuối cùng từ blockchain
    const lastRound = tournament.current_round;
    const leaderboard = await getLeaderboardFromChain(tournament_id, lastRound);

    // 4. Sắp xếp theo điểm giảm dần, nếu cần thêm tiêu chí khác, bổ sung ở đây
    leaderboard.sort((a, b) => b.score - a.score);

    // 5. Gọi smart contract phân phối từng top
    const distributions = [];
    for (let i = 0; i < rewards.length && i < leaderboard.length; i++) {
      const reward = rewards[i];
      const winner = leaderboard[i];

      // gọi smart contract chỉ cần address, amount
      await distributeRewardOnChain(winner.address, reward.reward_amount);

      distributions.push({
        rank: reward.rank,
        address: winner.address,
        amount: reward.reward_amount
      });
    }

    return res.json(responseSuccess(distributions, 'Đã phân phối giải thưởng thành công'));

  } catch (error) {
    console.error('distributeTournamentRewards error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};
