import models from '../models/index.js';
import { getLeaderboardFromChain, distributeRewardOnChain } from '../services/BlockchainService.js';
import { responseSuccess, responseWithError } from '../response/ResponseSuccess.js';
import { ErrorCodes } from '../constant/ErrorCodes.js';

/**
 * Admin phân phối giải thưởng dựa trên BXH cuối cùng
 * POST /api/tournaments/:tournament_id/distribute-rewards
 */
export const distributeTournamentRewards = async (req, res) => {
  const t = await models.sequelize.transaction();
  
  try {
    const { tournament_id } = req.params;
    const { id: admin_id } = req.user; // Lấy ID admin từ token

    // 1️⃣ Lấy giải đấu
    const tournament = await models.Tournament.findByPk(tournament_id, { transaction: t });
    if (!tournament) {
      await t.rollback();
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại.'));
    }

    // Kiểm tra giải đấu đã kết thúc
    if (tournament.status !== 'COMPLETED') {
      await t.rollback();
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Chỉ có thể phân phối cho giải đấu đã kết thúc.'));
    }

    // Kiểm tra đã phân phối chưa
    if (tournament.reward_distributed === 1) {
      await t.rollback();
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Giải thưởng đã được phân phối rồi.'));
    }

    // Kiểm tra đã ghi BXH lên blockchain chưa
    if (tournament.leaderboard_saved !== 1) {
      await t.rollback();
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Chưa ghi BXH lên blockchain. Vui lòng ghi BXH trước khi phân phối.'));
    }

    // 2️⃣ Lấy danh sách reward từ DB
    const rewards = await models.TournamentReward.findAll({
      where: { tournament_id },
      order: [['rank', 'ASC']],
      transaction: t
    });

    if (!rewards || rewards.length === 0) {
      await t.rollback();
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Chưa có cấu hình reward cho giải đấu.'));
    }

    // 3️⃣ Lấy BXH cuối cùng từ blockchain (sử dụng total_rounds)
    const leaderboard = await getLeaderboardFromChain(tournament_id, tournament.total_rounds);

    if (!leaderboard || leaderboard.length === 0) {
      await t.rollback();
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Không tìm thấy BXH trên blockchain.'));
    }

    // 5️⃣ Lấy thông tin participants để lưu vào TransactionHistory
    const walletAddresses = leaderboard.slice(0, rewards.length).map(l => l.wallet);
    const participants = await models.Participant.findAll({
      where: {
        tournament_id,
        wallet_address: walletAddresses,
        status: 'APPROVED'
      },
      transaction: t
    });

    // Map wallet -> participant_id, user_id
    const walletToParticipant = {};
    participants.forEach(p => {
      walletToParticipant[p.wallet_address] = {
        participant_id: p.id,
        user_id: p.user_id
      };
    });

    // 6️⃣ Phân phối giải thưởng và lưu transaction history
    const distributions = [];
    
    for (let i = 0; i < rewards.length && i < leaderboard.length; i++) {
      const reward = rewards[i];
      const winner = leaderboard[i];
      const participantInfo = walletToParticipant[winner.wallet];

      if (!participantInfo) {
        console.warn(`Không tìm thấy participant cho wallet ${winner.wallet}`);
        continue;
      }

      try {
        // Gọi smart contract phân phối
        const txResult = await distributeRewardOnChain(winner.wallet, reward.reward_amount);

        // Cập nhật tx_hash vào TournamentReward
        await reward.update({ 
          tx_hash: txResult.txHash,
          distributed_at: new Date()
        }, { transaction: t });

        // Lưu vào TransactionHistory
        await models.TransactionHistory.create({
          tournament_id: tournament_id,
          participant_id: participantInfo.participant_id,
          user_id: participantInfo.user_id,
          from_user_id: admin_id, // Admin phân phối
          to_user_id: participantInfo.user_id, // User nhận
          actor: 'ADMIN',
          type: 'DISTRIBUTE_REWARD',
          tx_hash: txResult.txHash,
          amount: reward.reward_amount,
          status: 'SUCCESS',
          description: `Phân phối giải thưởng hạng ${reward.rank}`
        }, { transaction: t });

        distributions.push({
          rank: reward.rank,
          wallet: winner.wallet,
          userId: participantInfo.user_id,
          amount: reward.reward_amount,
          txHash: txResult.txHash,
          blockNumber: txResult.blockNumber
        });

      } catch (error) {
        console.error(`Lỗi phân phối cho hạng ${reward.rank}:`, error);
        await t.rollback();
        return res.json(responseWithError(
          ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 
          `Lỗi phân phối giải thưởng hạng ${reward.rank}: ${error.message}`
        ));
      }
    }

    // 7️⃣ Đánh dấu giải đấu đã phân phối
    await tournament.update({ 
      reward_distributed: 1,
      reward_distributed_at: new Date()
    }, { transaction: t });

    // 8️⃣ Commit transaction
    await t.commit();

    return res.json(responseSuccess({
      tournament_id: tournament_id,
      total_distributed: distributions.length,
      distributions
    }, `Đã phân phối thành công ${distributions.length} giải thưởng`));

  } catch (error) {
    await t.rollback();
    console.error('distributeTournamentRewards error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};
