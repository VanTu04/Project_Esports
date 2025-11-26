import models from '../models/index.js';
import { getLeaderboardFromChain, distributeRewardOnChain, fundContractForRewards, getContractBalance } from '../services/BlockchainService.js';
import { responseSuccess, responseWithError } from '../response/ResponseSuccess.js';
import { ErrorCodes } from '../constant/ErrorCodes.js';

/**
 * Admin phân phối giải thưởng dựa trên BXH cuối cùng
 * POST /api/tournaments/:tournament_id/distribute-rewards
 */
export const distributeTournamentRewards = async (req, res) => {
  const t = await models.sequelize.transaction();
  
  try {
    const { tournament_id } = req.body;
    const { id: admin_id } = req.user; // Lấy ID admin từ token
    console.log("Phân phối giải thưởng cho giải đấu ID:", tournament_id, "bởi admin ID:", admin_id);

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

    // 6️⃣ Tính tổng tiền cần phân phối
    const totalRewardAmount = rewards.reduce((sum, r) => sum + parseFloat(r.reward_amount), 0);
    console.log(`💰 Tổng phần thưởng cần phân phối: ${totalRewardAmount} ETH`);

    // 7️⃣ Kiểm tra số dư contract
    const contractBalance = await getContractBalance();
    console.log(`📦 Số dư contract hiện tại: ${contractBalance} ETH`);

    // 8️⃣ Nếu không đủ, admin nạp thêm tiền vào contract
    if (contractBalance < totalRewardAmount) {
      const amountToFund = totalRewardAmount - contractBalance + 0.01; // Thêm 0.01 ETH dự phòng
      console.log(`⚠️ Contract thiếu ${amountToFund.toFixed(4)} ETH, đang nạp tiền...`);

      const fundResult = await fundContractForRewards(amountToFund);
      console.log(`✅ Đã nạp ${amountToFund} ETH vào contract. TX: ${fundResult.txHash}`);

      // Ghi lại transaction admin nạp tiền (chi tiền ra)
      await models.TransactionHistory.create({
        tournament_id: tournament_id,
        participant_id: null, // Không liên quan đến participant cụ thể
        user_id: admin_id,
        from_user_id: admin_id,
        to_user_id: null, // Nạp vào contract, không có người nhận cụ thể
        actor: 'ADMIN',
        type: 'FUND_CONTRACT',
        tx_hash: fundResult.txHash,
        amount: amountToFund,
        status: 'SUCCESS',
        description: `Admin nạp ${amountToFund} ETH vào contract để phân phối giải thưởng giải đấu #${tournament_id}`
      }, { transaction: t });
    }

    // 9️⃣ Phân phối giải thưởng cho từng team
    // 9️⃣ Phân phối giải thưởng cho từng team
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
        // Gọi smart contract phân phối từ contract -> team
        console.log(`⏳ Đang phân phối cho hạng ${reward.rank}...`);
        const txResult = await distributeRewardOnChain(winner.wallet, reward.reward_amount);
        console.log(`✅ Phân phối hạng ${reward.rank} thành công. TX: ${txResult.txHash}`);

        // Đợi 500ms để tránh nonce conflict
        await new Promise(resolve => setTimeout(resolve, 500));

        // Cập nhật hash (tên cột trong DB là `hash`) vào TournamentReward
        await reward.update({ 
          hash: txResult.txHash,
          distributed_at: new Date(),
          blockNumber: txResult.blockNumber
        }, { transaction: t });

        // Lưu 1 bản ghi TransactionHistory cho user (thu tiền từ contract)
        await models.TransactionHistory.create({
          tournament_id: tournament_id,
          participant_id: participantInfo.participant_id,
          user_id: participantInfo.user_id, // User xem được giao dịch này
          from_user_id: admin_id,
          to_user_id: participantInfo.user_id,
          actor: 'SYSTEM',
          type: 'RECEIVE_REWARD',
          tx_hash: txResult.txHash,
          amount: reward.reward_amount,
          status: 'SUCCESS',
          description: `Nhận giải thưởng hạng ${reward.rank} từ giải đấu #${tournament_id}`
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

    // 🔟 Đánh dấu giải đấu đã phân phối
    await tournament.update({ 
      reward_distributed: 1,
      reward_distributed_at: new Date()
    }, { transaction: t });

    // 1️⃣1️⃣ Commit transaction
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

/**
 * Admin nạp tiền vào contract để chuẩn bị phân phối
 * POST /api/admin/fund-contract
 */
export const fundContract = async (req, res) => {
  const t = await models.sequelize.transaction();
  try {
    const { amount } = req.body;
    const { id: admin_id } = req.user; // Lấy ID admin từ token

    if (!amount || amount <= 0) {
      await t.rollback();
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Số tiền phải lớn hơn 0'));
    }

    // gọi hàm nạp tiền vào contract (external call)
    const result = await fundContractForRewards(amount);

    // Ghi lại transaction admin nạp tiền (chi tiền ra) trong DB transaction
    await models.TransactionHistory.create({
      tournament_id: null,
      participant_id: null,
      user_id: admin_id,
      from_user_id: admin_id,
      to_user_id: null, // Nạp vào contract, không có người nhận cụ thể
      actor: 'ADMIN',
      type: 'FUND_CONTRACT',
      tx_hash: result.txHash,
      amount: amount,
      status: 'SUCCESS',
      description: `Admin nạp ${amount} ETH vào contract để phân phối giải thưởng`
    }, { transaction: t });

    await t.commit();

    return res.json(responseSuccess(result, `Đã nạp ${amount} ETH vào contract thành công`));

  } catch (error) {
    try { await t.rollback(); } catch (e) { /* ignore rollback error */ }
    console.error('fundContract error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

/**
 * Kiểm tra số dư của contract
 * GET /api/admin/contract-balance
 */
export const checkContractBalance = async (req, res) => {
  try {
    const balance = await getContractBalance();

    return res.json(responseSuccess({ balance }, `Số dư contract: ${balance} ETH`));

  } catch (error) {
    console.error('checkContractBalance error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

