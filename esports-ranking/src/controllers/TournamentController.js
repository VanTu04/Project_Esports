// File: controllers/tournament.controller.js
import * as tournamentService from '../services/TournamentService.js';
import { responseSuccess, responseWithError } from '../response/ResponseSuccess.js';
import {  updateLeaderboardOnChain, getLeaderboardFromChain, getRegistrationStatus, ethToWei, generateRegistrationSignature, approveRegistration, weiToEth, rejectRegistration } from '../services/BlockchainService.js';
import { ErrorCodes } from '../constant/ErrorCodes.js';
import models from '../models/index.js';
import { isAddress } from 'ethers';
import { Op } from 'sequelize';
import * as userService from '../services/UserService.js';

const backendUrl = (process.env.BACKEND_URL || 'https://api.vawndev.online').replace(/\/$/, '');

const normalizeImageUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (/^data:/i.test(url)) return url;
  if (url.startsWith('/')) return `${backendUrl}${url}`;
  return `${backendUrl}/${url}`;
};

// 1. Tạo một giải đấu mới
export const createTournamentWithRewards = async (req, res) => {
  try {
    let { name, game_id, total_rounds, total_team, rewards, start_date, end_date, registration_fee, description } = req.body;
    
    // Parse rewards nếu là JSON string từ FormData
    if (typeof rewards === 'string') {
      try {
        rewards = JSON.parse(rewards);
      } catch (e) {
        console.warn('Failed to parse rewards:', e.message);
        rewards = [];
      }
    }
    
    console.log("Creating tournament with data:", req.body);
    console.log("Parsed rewards:", rewards);
    console.log("Uploaded file:", req.file);
    
    // Handle uploaded image - tournaments are saved in uploads/tournaments/
    const image = req.file ? `/uploads/tournaments/${req.file.filename}` : null;
    console.log("Image path to save:", image);
    
    if (!name || !total_rounds || !total_team) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Tên, tổng số vòng và tổng số đội là bắt buộc.'));
    }

    if (registration_fee && isNaN(Number(registration_fee))) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Phí đăng ký không hợp lệ.'));
    }

    // Validate game_id if provided
    if (game_id) {
      const game = await models.Game.findOne({
        where: { id: game_id, status: 'ACTIVE', deleted: false }
      });
      if (!game) {
        return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Game không tồn tại hoặc không ở trạng thái ACTIVE.'));
      }
    }

    const existing = await tournamentService.getTournamentByName(name);
    if (existing) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_EXIST, 'Giải đấu đã tồn tại.'));
    }

    console.log("BODY:", req.body);
    const result = await models.sequelize.transaction(async (t) => {
      const tournament = await tournamentService.create({ name, game_id, total_rounds, total_team, start_date, end_date, registration_fee, description, image }, { transaction: t });
      if (Array.isArray(rewards) && rewards.length > 0) {
        const rewardsData = rewards.map(r => ({
          tournament_id: tournament.id,
          rank: r.rank,
          reward_amount: Number(r.reward_amount)
        }));
        await models.TournamentReward.bulkCreate(rewardsData, { transaction: t });
      }

      // Reload tournament including created rewards so caller gets rank & reward_amount
      const tournamentWithRewards = await models.Tournament.findByPk(tournament.id, {
        transaction: t,
        include: [
          {
            model: models.TournamentReward,
            as: 'rewards',
            attributes: ['id', 'rank', 'reward_amount']
          }
        ]
      });

      return tournamentWithRewards;
    });

    return res.json(responseSuccess(result, 'Tạo giải đấu và reward thành công'));
  } catch (error) {
    console.error('createTournamentWithRewards error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const isReadyTrue = async (req, res) => {
  try {
    const { id } = req.body;
    // Use the Sequelize model instance directly so we can persist changes.
    const tournament = await models.Tournament.findByPk(id);
    if (!tournament) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại.'));
    }

    // Persist as numeric flag (some code checks === 1)
    await tournament.update({ isReady: 1 });

    // Return the updated plain object
    const updated = await models.Tournament.findByPk(id);
    return res.json(responseSuccess(updated.get ? updated.get({ plain: true }) : updated, 'Cập nhật isReady thành công'));
  } catch (error) {
    console.error('isReadyTrue error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const getTournamentRewards = async (req, res) => {
  try {
    const { tournament_id } = req.params;
    const rewards = await models.TournamentReward.findAll({
      where: { tournament_id },
      order: [['rank', 'ASC']]
    });
    return res.json(responseSuccess(rewards));
  } catch (err) {
    console.error(err);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, err.message));
  }
};

export const getTournamentDistributions = async (req, res) => {
  try {
    const { tournament_id } = req.params;
    const distributions = await models.TournamentDistribution.findAll({
      where: { tournament_id },
      order: [['createdAt', 'DESC']]
    });
    return res.json(responseSuccess(distributions));
  } catch (err) {
    console.error('getTournamentDistributions error', err);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, err.message));
  }
};


// 2. Lấy danh sách tất cả các giải đấu
export const getAllTournamentsAdmin = async (req, res) => {
  try {
    const { status, page, limit, isReady, search, hasRegistrations } = req.query;
    
    const filters = { isReady, search, hasRegistrations };
    const result = await tournamentService.findAllByAdmin(status, page, limit, filters);
    return res.json(responseSuccess(result, 'Lấy danh sách giải đấu thành công'));
  } catch (error) {
    console.error('getAllTournaments error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

// API thống kê tổng quan
export const getTournamentStatistics = async (req, res) => {
  try {
    // Get all tournaments count
    const totalTournaments = await models.Tournament.count({ where: { deleted: 0 } });
    
    // Count by status
    const activeTournaments = await models.Tournament.count({ where: { deleted: 0, status: 'ACTIVE' } });
    const notOpenTournaments = await models.Tournament.count({ where: { deleted: 0, status: 'PENDING', isReady: 0 } });
    const upcomingTournaments = await models.Tournament.count({ where: { deleted: 0, status: 'PENDING', isReady: 1 } });
    const completedTournaments = await models.Tournament.count({ where: { deleted: 0, status: 'COMPLETED' } });
    
    // Total teams (unique users with approved participants - count distinct user_id)
    const totalTeamsResult = await models.Participant.findAll({
      where: { status: 'APPROVED' },
      attributes: [[models.sequelize.fn('COUNT', models.sequelize.fn('DISTINCT', models.sequelize.col('user_id'))), 'count']],
      raw: true
    });
    const totalTeams = Number(totalTeamsResult[0]?.count) || 0;
    
    // Total distributed matches (DONE status only - matches that have been completed and finalized)
    const distributedMatches = await models.Match.count({
      where: {
        status: 'DONE'
      }
    });
    
    
    // Total distributed prize pool (sum rewards with blockNumber - confirmed on blockchain)
    const distributedRewardsResult = await models.TournamentReward.sum('reward_amount', {
      where: {
        blockNumber: { [Op.ne]: null }
      }
    });
    
    
    const totalDistributedPrizePool = Number(distributedRewardsResult) || 0;
    

    return res.json(responseSuccess({
      total: totalTournaments,
      active: activeTournaments,
      notOpen: notOpenTournaments,
      upcoming: upcomingTournaments,
      completed: completedTournaments,
      totalTeams,
      totalDistributedMatches: Number(distributedMatches) || 0,
      totalDistributedPrizePool: Number(totalDistributedPrizePool) || 0
    }, 'Lấy thống kê thành công'));
  } catch (error) {
    console.error('getTournamentStatistics error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const getAllTournaments = async (req, res) => {
  try {
    const { status, page, limit, hasMatches, search, game_id } = req.query;
    const filters = { hasMatches, search, game_id };

    const result = await tournamentService.findAll(status, page, limit, filters);
    return res.json(responseSuccess(result, 'Lấy danh sách giải đấu thành công'));
  } catch (error) {
    console.error('getAllTournaments error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

// 3. Lấy thông tin chi tiết 1 giải đấu
export const getTournamentById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await tournamentService.findById(id);

    if (!result) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại.'));
    }

    return res.json(responseSuccess(result, 'Lấy giải đấu thành công'));
  } catch (error) {
    console.error('getTournamentById error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

// 4. Đăng ký một đội (User) vào giải đấu
export const registerTeam = async (req, res) => {
  try {
    const { id: tournament_id } = req.params; 
    const { user_id } = req.body; 

    if (!user_id) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'user_id (ID của đội) là bắt buộc.'));
    }

    const tournament = await tournamentService.findById(tournament_id);
    if (!tournament) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại.'));
    }

    // Chỉ cho phép khi đang PENDING
    if (tournament.status !== 'PENDING') { 
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Giải đấu đã bắt đầu, không thể đăng ký.'));
    }

    const team = await tournamentService.findUserById(user_id);
    if (!team) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Đội (User) không tồn tại.'));
    }

    // Gọi đúng tên hàm service mới
    const existingParticipant = await tournamentService.findParticipantByUser(tournament_id, user_id); 
    if (existingParticipant) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_EXIST, 'Đội này đã được đăng ký vào giải.'));
    }

    const participantData = {
      tournament_id: tournament.id,
      user_id: team.id,
      wallet_address: team.wallet_address,
      team_name: team.full_name,
      has_received_bye: false,
      status: 'APPROVED' // Admin thêm là duyệt luôn
    };

    // Gọi đúng tên hàm service mới
    const result = await tournamentService.createParticipant(participantData); 
    return res.json(responseSuccess(result, 'Đăng ký (và duyệt) đội thành công'));

  } catch (error) {
    console.error('registerTeam error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const updateTournamentRewards = async (req, res) => {
  try {
    // Support both `:tournament_id` and `:id` route parameter names (frontend uses /:id)
    const tournamentId = req.params.tournament_id ?? req.params.id;
    
    console.log('📝 updateTournamentRewards called for tournament:', tournamentId);
    console.log('📝 req.body:', req.body);
    console.log('📝 req.file:', req.file);
    
    // Extract tournament fields and rewards from request body
    let { name, game_id, total_rounds, total_team, start_date, end_date, description, registration_fee, rewards, image, delete_image } = req.body;

    // Parse rewards if it's a JSON string from FormData
    if (typeof rewards === 'string') {
      try {
        rewards = JSON.parse(rewards);
        console.log('📝 Parsed rewards from JSON string:', rewards);
      } catch (e) {
        console.warn('Failed to parse rewards:', e.message);
        rewards = [];
      }
    }

    // Check if tournament exists
    const tournament = await models.Tournament.findByPk(tournamentId);
    if (!tournament) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại.'));
    }

    // Prepare update data for tournament (only update provided fields)
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (game_id !== undefined) updateData.game_id = game_id;
    if (total_rounds !== undefined) updateData.total_rounds = total_rounds;
    if (total_team !== undefined) updateData.total_team = total_team;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (description !== undefined) updateData.description = description;
    if (registration_fee !== undefined) updateData.registration_fee = registration_fee;
    
    // Handle image update
    if (req.file) {
      // New image uploaded via multer
      updateData.image = `/uploads/tournaments/${req.file.filename}`;
      console.log('📸 New image uploaded:', updateData.image);
    } else if (delete_image === true || delete_image === 'true') {
      // User wants to delete the image
      updateData.image = null;
      console.log('🗑️ Image marked for deletion');
    } else if (image !== undefined) {
      // Keep the existing image URL (sent from frontend)
      updateData.image = image;
      console.log('🖼️ Keeping existing image:', image);
    }
    // If none of the above, don't update the image field (keep current value in DB)

    // Update tournament information
    if (Object.keys(updateData).length > 0) {
      await tournament.update(updateData);
      console.log('✅ Tournament updated:', updateData);
    }

    // Update rewards if provided
    if (Array.isArray(rewards) && rewards.length > 0) {
      // Delete old rewards
      await models.TournamentReward.destroy({ where: { tournament_id: tournamentId } });

      // Create new rewards
      for (const r of rewards) {
        await models.TournamentReward.create({
          tournament_id: tournamentId,
          rank: r.rank,
          reward_amount: r.reward_amount
        });
      }
      console.log('🎁 Rewards updated:', rewards.length, 'rewards');
    }

    // Fetch updated tournament with rewards
    const updatedTournament = await models.Tournament.findByPk(tournamentId, {
      include: [
        {
          model: models.TournamentReward,
          as: 'rewards',
          attributes: ['id', 'rank', 'reward_amount']
        }
      ]
    });

    return res.json(responseSuccess(updatedTournament, 'Cập nhật giải đấu và phần thưởng thành công'));
  } catch (err) {
    console.error('updateTournamentRewards error', err);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, err.message));
  }
};
;
;


// 5. Xóa (hủy) một giải đấu
export const deleteTournament = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Existence Check (Giống deleteGame)
    const existingTournament = await tournamentService.findById(id);
    if (!existingTournament) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại.'));
    }

    // Chỉ cho phép hủy giải đấu đang 'PENDING'
    if (existingTournament.isReady === 1 || existingTournament.status !== 'PENDING') {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Không thể xóa giải đấu đang diễn ra hoặc đã kết thúc.'));
    }

    if (existingTournament.participants && existingTournament.participants.length > 0) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, `Không thể xóa giải đấu. Đã có ${existingTournament.participants.length} đội tham gia (kể cả PENDING/REJECTED).`));
    }

    // 3. Gọi Service
    const result = await tournamentService.deleteTournament(id);
    await models.TournamentReward.destroy({ where: { tournament_id: id } });
    await models.TournamentDistribution.destroy({ where: { tournament_id: id } });

    return res.json(responseSuccess(result, 'Xóa vĩnh viễn giải đấu thành công.'));

  } catch (error) {
    console.error('deleteTournament error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};


// TEAM GỬI YÊU CẦU THAM GIA
export const requestJoinTournament = async (req, res) => {
  try {
    const { id: tournament_id } = req.params;
    const { id: user_id } = req.user;

    // 1. Kiểm tra Giải đấu
    const tournament = await tournamentService.findById(tournament_id);
    if (!tournament) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại.'));
    }

    if (tournament.status !== 'PENDING') {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Giải đấu đã bắt đầu hoặc kết thúc, không thể gửi yêu cầu.'));
    }

    // 2. Kiểm tra Đội (User)
    const team = await tournamentService.findUserById(user_id);
    if (!team) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Đội (User) không tồn tại.'));
    }

    if (!team.wallet_address) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Bạn chưa liên kết ví. Vui lòng kết nối MetaMask trước.'));
    }
    
    // 3. Kiểm tra đã request chưa
    let participant = await tournamentService.findParticipantByUser(tournament_id, user_id);
    if (participant) {
      // Nếu đã tồn tại và KHÔNG phải là PENDING thì chặn
      if (participant.status !== 'PENDING') {
         return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_EXIST, 'Bạn đã gửi yêu cầu tham gia giải đấu này rồi.'));
      }
      // Nếu là PENDING thì code tự động chạy tiếp xuống dưới để retry
    }

    try {
      console.log('Checking blockchain registration status for', team.wallet_address, "id:", tournament_id);
      const blockchainStatus = await getRegistrationStatus(tournament_id, team.wallet_address);
      if (blockchainStatus.status !== 0) { 
        return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_EXIST, 'Địa chỉ ví này đã đăng ký trên blockchain.'));
      }
    } catch (error) {
      console.log('Blockchain check passed (user not registered yet)');
    }
    
    const registrationFeeInEth = tournament.registration_fee || "0.1"; 
    const amountInWei = ethToWei(registrationFeeInEth);

    // 5. Tạo chữ ký 
    const signature = await generateRegistrationSignature(
      team.wallet_address,
      tournament_id,
      amountInWei
    );

    // 4. Tạo request (Nếu chưa có)
    if (!participant) {
      const participantData = {
        tournament_id: tournament.id,
        user_id: team.id,
        wallet_address: team.wallet_address,
        team_name: team.full_name,
        status: 'PENDING', 
        registration_fee: registrationFeeInEth
      };
      participant = await tournamentService.createParticipant(participantData);
    }

    // 7. Trả về signature
    return res.json(responseSuccess({
      participant_id: participant.id,
      signature,
      amountInWei,
      amountInEth: registrationFeeInEth,
      wallet_address: team.wallet_address,
      contractAddress: process.env.LEADERBOARD_CONTRACT_ADDRESS,
      message: 'Vui lòng xác nhận giao dịch trên MetaMask để hoàn tất đăng ký.'
    }, 'Lấy thông tin đăng ký thành công.'));

  } catch (error) {
    console.error('requestJoinTournament error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

// ================= USER: XÁC NHẬN ĐÃ GỌI SMART CONTRACT =================
/**
 * Bước 2: Sau khi User gọi Smart Contract thành công
 * Frontend gọi API này để cập nhật trạng thái trong Database
 */
export const confirmBlockchainRegistration = async (req, res) => {
  try {
    const { participant_id } = req.params;
    const { tx_hash } = req.body; // Transaction hash từ blockchain
    const { id: user_id } = req.user;

    // 1. Tìm participant
    const participant = await tournamentService.findParticipantById(participant_id);
    if (!participant) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Không tìm thấy yêu cầu tham gia.'));
    }

    // Kiểm tra quyền sở hữu
    if (participant.user_id !== user_id) {
      return res.json(responseWithError(ErrorCodes.ERROR_UNAUTHORIZED, 'Bạn không có quyền cập nhật yêu cầu này.'));
    }

    // 2. Xác minh trạng thái trên Blockchain
    const blockchainStatus = await getRegistrationStatus(
      participant.tournament_id, 
      participant.wallet_address
    );

    if (blockchainStatus.status !== 1) { // 1 = Pending on blockchain
      return res.json(responseWithError(
        ErrorCodes.ERROR_REQUEST_DATA_INVALID, 
        'Chưa tìm thấy giao dịch trên blockchain. Vui lòng đợi vài giây và thử lại.'
      ));
    }

    // 3. Cập nhật Database: PENDING → WAITING_APPROVAL (đã nạp tiền, chờ admin duyệt)
    await participant.update({ 
      status: 'WAITING_APPROVAL',
      blockchain_tx_hash: tx_hash,
      paid_at: new Date()
    });

    await models.TransactionHistory.create({
      tournament_id: participant.tournament_id,
      participant_id: participant.id,
      user_id: participant.user_id,
      from_user_id: participant.user_id,
      to_user_id: null,
      actor: 'TEAM',
      type: 'REGISTER',
      tx_hash: tx_hash,
      amount: participant.registration_fee // Lưu dưới dạng ETH
    });

    return res.json(responseSuccess(participant, 'Xác nhận thanh toán thành công. Chờ Admin duyệt.'));

  } catch (error) {
    console.error('confirmBlockchainRegistration error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

// ================= ADMIN: DUYỆT YÊU CẦU (RÚT TIỀN VỀ ADMIN) =================
/**
 * Admin duyệt -> Tiền từ Smart Contract chuyển về ví Admin
 */
export const approveJoinRequest = async (req, res) => {
  try {
    const { participant_id } = req.params;
    const { id: admin_id } = req.user; // Lấy ID admin từ token
    console.log("Admin abcd", admin_id, "approving participant", participant_id);
    // 1. Tìm request
    const participant = await tournamentService.findParticipantById(participant_id);
    if (!participant) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Không tìm thấy yêu cầu tham gia.'));
    }

    // 2. Kiểm tra trạng thái
    if (participant.status !== 'WAITING_APPROVAL') {
      return res.json(responseWithError(
        ErrorCodes.ERROR_REQUEST_DATA_INVALID, 
        `Không thể duyệt. Trạng thái hiện tại: ${participant.status}`
      ));
    }

    // 3. Xác minh lại trên Blockchain
    const blockchainStatus = await getRegistrationStatus(
      participant.tournament_id, 
      participant.wallet_address
    );

    if (blockchainStatus.status !== 1) { // 1 = Pending
      return res.json(responseWithError(
        ErrorCodes.ERROR_REQUEST_DATA_INVALID, 
        'Trạng thái blockchain không hợp lệ. Có thể đã được xử lý rồi.'
      ));
    }

    // 4. Gọi Smart Contract: approveRegistration()
    // Tiền sẽ chuyển từ Contract -> Admin wallet
    const result = await approveRegistration(
      participant.tournament_id, 
      participant.wallet_address
    );

    // 5. Cập nhật Database: WAITING_APPROVAL -> APPROVED
    await participant.update({ 
      status: 'APPROVED',
      approved_at: new Date(),
      approval_tx_hash: result.txHash
    });

    await models.TransactionHistory.create({
      tournament_id: participant.tournament_id,
      participant_id: participant.id,
      user_id: admin_id, // Admin nhận tiền
      from_user_id: participant.user_id,
      to_user_id: admin_id,
      actor: 'ADMIN',
      type: 'APPROVE',
      tx_hash: result.txHash,
      amount: weiToEth(result.amountTransferred) // Chuyển từ wei sang ETH
    });

    return res.json(responseSuccess({
      participant,
      blockchain: {
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        amountTransferred: weiToEth(result.amountTransferred) + ' ETH'
      }
    }, 'Duyệt thành công. Tiền đã chuyển về ví Admin.'));

  } catch (error) {
    console.error('approveJoinRequest error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

// ================= ADMIN: TỪ CHỐI YÊU CẦU (HOÀN TIỀN CHO USER) =================
/**
 * Admin từ chối -> Tiền từ Smart Contract hoàn lại cho User
 */
export const rejectJoinRequest = async (req, res) => {
  try {
    const { participant_id } = req.params;
    const { reason } = req.body; // Lý do từ chối (optional)
    const { id: admin_id } = req.user; // Lấy ID admin từ token

    // 1. Tìm request
    const participant = await tournamentService.findParticipantById(participant_id);
    if (!participant) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Không tìm thấy yêu cầu tham gia.'));
    }

    // 2. Kiểm tra trạng thái
    if (participant.status !== 'WAITING_APPROVAL') {
      return res.json(responseWithError(
        ErrorCodes.ERROR_REQUEST_DATA_INVALID, 
        `Không thể từ chối. Trạng thái hiện tại: ${participant.status}`
      ));
    }

    // 3. Xác minh trên Blockchain
    const blockchainStatus = await getRegistrationStatus(
      participant.tournament_id, 
      participant.wallet_address
    );

    if (blockchainStatus.status !== 1) { // 1 = Pending
      return res.json(responseWithError(
        ErrorCodes.ERROR_REQUEST_DATA_INVALID, 
        'Trạng thái blockchain không hợp lệ.'
      ));
    }

    // 4. Gọi Smart Contract: rejectRegistration()
    // Tiền sẽ hoàn lại cho User
    const result = await rejectRegistration(
      participant.tournament_id, 
      participant.wallet_address
    );

    // 5. Cập nhật Database: WAITING_APPROVAL -> REJECTED
    await participant.update({ 
      status: 'REJECTED',
      rejected_at: new Date(),
      rejection_reason: reason || 'Không đáp ứng yêu cầu',
      rejection_tx_hash: result.txHash
    });

    await models.TransactionHistory.create({
      tournament_id: participant.tournament_id,
      participant_id: participant.id,
      user_id: participant.user_id,
      from_user_id: admin_id,
      to_user_id: participant.user_id,
      actor: 'ADMIN',
      type: 'RECEIVE_REFUND',
      description: `Lý do bị từ chối giải ${participant.tournament_id}: ${participant.rejection_reason || 'Không có lý do'}`,
      tx_hash: result.txHash,
      amount: weiToEth(result.amountRefunded) // Chuyển từ wei sang ETH
    });

    return res.json(responseSuccess({
      participant,
      blockchain: {
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        amountRefunded: weiToEth(result.amountRefunded) + ' ETH'
      }
    }, 'Từ chối thành công. Tiền đã hoàn lại cho User.'));

  } catch (error) {
    console.error('rejectJoinRequest error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

// ================= ADMIN: XEM DANH SÁCH CHỜ DUYỆT =================
export const getPendingRequests = async (req, res) => {
  try {
    const { id: tournament_id } = req.params;

    console.log("Fetching pending participants for tournament_id:", tournament_id);
    // Lấy từ Database
    const pendingParticipants = await tournamentService.findParticipantsByStatus(
      tournament_id,
      'WAITING_APPROVAL'
    );

    console.log("pendingParticipants:", pendingParticipants);

    // Bổ sung thông tin từ Blockchain (optional: để double-check)
    const participantsWithBlockchainStatus = await Promise.all(
      pendingParticipants.map(async (p) => {
        try {
          const blockchainStatus = await getRegistrationStatus(tournament_id, p.wallet_address);
          const plain = (typeof p.toJSON === 'function') ? p.toJSON() : (typeof p.get === 'function' ? p.get({ plain: true }) : p);
          plain.avatar = normalizeImageUrl(plain.avatar || plain.team?.avatar || plain.logo_url || plain.logo || null);
          plain.logo_url = plain.avatar;
          return {
            ...plain,
            blockchain_status: blockchainStatus.statusName,
            blockchain_amount: weiToEth(blockchainStatus.amountDeposited) + ' ETH'
          };
        } catch (error) {
          const plain = (typeof p.toJSON === 'function') ? p.toJSON() : (typeof p.get === 'function' ? p.get({ plain: true }) : p);
          plain.avatar = normalizeImageUrl(plain.avatar || plain.team?.avatar || plain.logo_url || plain.logo || null);
          plain.logo_url = plain.avatar;
          return {
            ...plain,
            blockchain_status: 'Error',
            blockchain_amount: '0 ETH'
          };
        }
      })
    );

    return res.json(responseSuccess({
      count: participantsWithBlockchainStatus.length,
      participants: participantsWithBlockchainStatus
    }, 'Lấy danh sách chờ duyệt thành công.'));

  } catch (error) {
    console.error('getPendingRequests error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

// ================= USER: KIỂM TRA TRẠNG THÁI ĐĂNG KÝ =================
export const getMyRegistrationStatus = async (req, res) => {
  try {
    const { id: tournament_id } = req.params;
    const { id: user_id } = req.user;

    // Lấy từ Database
    const participant = await tournamentService.findParticipantByUser(tournament_id, user_id);
    if (!participant) {
      return res.json(responseSuccess({
        registered: false,
        message: 'Bạn chưa đăng ký giải đấu này.'
      }));
    }

    // Lấy từ Blockchain
    let blockchainStatus = null;
    try {
      blockchainStatus = await getRegistrationStatus(tournament_id, participant.wallet_address);
    } catch (error) {
      console.log('Blockchain status check failed:', error.message);
    }

    return res.json(responseSuccess({
      registered: true,
      participant: participant.toJSON(),
      blockchain: blockchainStatus ? {
        status: blockchainStatus.statusName,
        amountDeposited: weiToEth(blockchainStatus.amountDeposited) + ' ETH'
      } : null
    }));

  } catch (error) {
    console.error('getMyRegistrationStatus error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};






// ⭐ THUẬT TOÁN SWISS PAIRING CẢI TIẾN
// Sử dụng backtracking để tìm cách ghép tối ưu, tránh deadlock

/**
 * Kiểm tra 2 đội đã gặp nhau chưa
 */
const hasPlayed = (p1Id, p2Id, matchHistory) => {
  return matchHistory.some(m =>
    (m.team_a_participant_id === p1Id && m.team_b_participant_id === p2Id) ||
    (m.team_a_participant_id === p2Id && m.team_b_participant_id === p1Id)
  );
};

/**
 * Thuật toán backtracking để tìm cách ghép cặp tối ưu
 */
const findOptimalPairing = (participants, used, matchHistory, currentPairs = []) => {
  // Tìm đội chưa ghép đầu tiên
  const unpairedIndex = participants.findIndex(p => !used.has(p.id));
  
  // Nếu tất cả đã ghép → thành công
  if (unpairedIndex === -1) {
    return { success: true, pairs: currentPairs };
  }

  const p1 = participants[unpairedIndex];

  // Thử ghép với tất cả đội phía sau
  for (let i = unpairedIndex + 1; i < participants.length; i++) {
    const p2 = participants[i];
    
    // Bỏ qua nếu đã dùng hoặc đã gặp nhau
    if (used.has(p2.id) || hasPlayed(p1.id, p2.id, matchHistory)) {
      continue;
    }

    // Thử ghép cặp này
    const newUsed = new Set(used);
    newUsed.add(p1.id);
    newUsed.add(p2.id);

    const newPairs = [...currentPairs, [p1, p2]];

    // Đệ quy tìm cách ghép tiếp
    const result = findOptimalPairing(participants, newUsed, matchHistory, newPairs);
    
    if (result.success) {
      return result;
    }
  }

  // Không tìm được cách ghép → backtrack
  return { success: false, pairs: [] };
};

/**
 * Ghép cặp Swiss với xử lý BYE thông minh
 */
const swissPairing = (participants, matchHistory) => {
  // Sắp xếp theo điểm giảm dần
  const sorted = [...participants].sort((a, b) => b.total_points - a.total_points);

  // Trường hợp đặc biệt: chỉ 1 đội
  if (sorted.length === 1) {
    return { 
      pairs: [], 
      byeTeam: sorted[0] 
    };
  }

  // Trường hợp số lẻ: tách đội yếu nhất làm BYE
  let candidates = sorted;
  let byeTeam = null;

  if (sorted.length % 2 === 1) {
    // Tìm đội yếu nhất chưa nhận BYE
    const noBye = sorted.filter(p => !p.has_received_bye);
    
    if (noBye.length > 0) {
      // Lấy đội yếu nhất chưa nhận BYE
      byeTeam = noBye[noBye.length - 1];
    } else {
      // Tất cả đã nhận BYE → lấy đội yếu nhất
      byeTeam = sorted[sorted.length - 1];
    }

    // Loại đội BYE khỏi danh sách ghép cặp
    candidates = sorted.filter(p => p.id !== byeTeam.id);
  }

  // Thử ghép cặp với backtracking
  const result = findOptimalPairing(candidates, new Set(), matchHistory);

  // Nếu ghép được → trả về kết quả
  if (result.success) {
    return {
      pairs: result.pairs,
      byeTeam
    };
  }

  // 🚨 Nếu không ghép được (rất hiếm) → ghép bắt buộc cho phép lặp lại đối thủ
  console.warn('⚠️ Không thể ghép cặp mà không lặp đối thủ. Cho phép lặp lại.');
  
  const forcedPairs = [];
  const used = new Set();

  for (let i = 0; i < candidates.length; i++) {
    if (used.has(candidates[i].id)) continue;

    // Tìm đối thủ gần nhất về điểm
    for (let j = i + 1; j < candidates.length; j++) {
      if (used.has(candidates[j].id)) continue;

      forcedPairs.push([candidates[i], candidates[j]]);
      used.add(candidates[i].id);
      used.add(candidates[j].id);
      break;
    }
  }

  return {
    pairs: forcedPairs,
    byeTeam
  };
};

// ⭐ CẬP NHẬT HÀM START TOURNAMENT
export const startTournamentSwiss = async (req, res) => {
  const t = await models.sequelize.transaction();

  try {
    const { id: tournament_id } = req.params;

    const tournament = await models.Tournament.findByPk(tournament_id, { transaction: t });
    if (!tournament) {
      await t.rollback();
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại.'));
    }

    if (tournament.status === 'COMPLETED') {
      await t.rollback();
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Giải đấu đã kết thúc.'));
    }

    const participants = await models.Participant.findAll({
      where: { tournament_id, status: 'APPROVED' },
      transaction: t
    });

    if (participants.length < 2) {
      await t.rollback();
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Cần ít nhất 2 đội.'));
    }

    if (participants.length < tournament.total_team) {
      await t.rollback();
      return res.json(responseWithError(
        ErrorCodes.ERROR_REQUEST_DATA_INVALID,
        `Số lượng đội đã duyệt (${participants.length}) chưa đủ (${tournament.total_team}).`
      ));
    }

    // ⭐ Từ chối và hoàn tiền cho các đội WAITING_APPROVAL khi bắt đầu giải đấu
    const waitingParticipants = await models.Participant.findAll({
      where: { tournament_id, status: 'WAITING_APPROVAL' },
      transaction: t
    });

    if (waitingParticipants.length > 0) {
      console.log(`Rejecting ${waitingParticipants.length} waiting participants and refunding...`);
      
      for (const participant of waitingParticipants) {
        try {
          // Cập nhật status = REJECTED
          await participant.update({
            status: 'REJECTED',
            rejection_reason: 'Giải đấu đã đủ số lượng đội và bắt đầu thi đấu.'
          }, { transaction: t });

          // Hoàn tiền qua blockchain (rejectRegistration tự động hoàn tiền)
          if (participant.wallet_address && participant.registration_fee) {
            const refundAmountInEth = participant.registration_fee;

            try {
              const result = await rejectRegistration(tournament_id, participant.wallet_address);
              console.log(`Refunded ${refundAmountInEth} ETH to ${participant.wallet_address}, tx: ${result.txHash}`);

              // Lưu transaction history
              await models.TransactionHistory.create({
                user_id: participant.user_id,
                tournament_id: tournament_id,
                type: 'REFUND',
                amount: refundAmountInEth,
                tx_hash: result.txHash,
                status: 'SUCCESS'
              }, { transaction: t });
            } catch (refundError) {
              console.error(`Failed to refund for participant ${participant.id}:`, refundError);
              // Không rollback transaction chính, chỉ log lỗi
              await models.TransactionHistory.create({
                user_id: participant.user_id,
                tournament_id: tournament_id,
                type: 'REFUND',
                amount: refundAmountInEth,
                status: 'FAILED',
                error_message: refundError.message
              }, { transaction: t });
            }
          }
        } catch (err) {
          console.error(`Error processing waiting participant ${participant.id}:`, err);
        }
      }
    }

    const matchesSoFar = await models.Match.findAll({
      where: { tournament_id },
      transaction: t
    });

    const round_number = matchesSoFar.length === 0
      ? 1
      : Math.max(...matchesSoFar.map(m => m.round_number)) + 1;

    // ⭐ Sử dụng thuật toán Swiss cải tiến
    const { pairs, byeTeam } = swissPairing(participants, matchesSoFar);

    const matchesData = pairs.map(pair => ({
      tournament_id,
      round_number,
      team_a_participant_id: pair[0].id,
      team_b_participant_id: pair[1].id,
      status: 'PENDING'
    }));

    // Xử lý BYE
    if (byeTeam) {
      const BYE_POINTS = 2;

      matchesData.push({
        tournament_id,
        round_number,
        team_a_participant_id: byeTeam.id,
        team_b_participant_id: null,
        winner_participant_id: byeTeam.id,
        status: 'COMPLETED',
        point_team_a: BYE_POINTS,
        point_team_b: 0
      });

      await models.Participant.update(
        { has_received_bye: true },
        { where: { id: byeTeam.id }, transaction: t }
      );

      await models.Participant.increment(
        { total_points: BYE_POINTS },
        { where: { id: byeTeam.id }, transaction: t }
      );
    }

    await models.Match.bulkCreate(matchesData, { transaction: t });

    const updateData = tournament.status === 'PENDING'
      ? { status: 'ACTIVE', current_round: round_number }
      : { current_round: round_number };

    await tournament.update(updateData, { transaction: t });

    await t.commit();

    return res.json(
      responseSuccess(
        {
          round_number,
          matches_created: matchesData.length,
          total_pairs: pairs.length,
          bye_team: byeTeam?.team_name || null,
          // 🔍 Debug info
          debug: {
            total_participants: participants.length,
            is_odd: participants.length % 2 === 1,
            expected_matches: Math.floor(participants.length / 2)
          }
        },
        `Đã tạo vòng ${round_number} thành công`
      )
    );
  } catch (error) {
    await t.rollback();
    console.error('startTournamentSwiss error:', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};


/**
 * GET /tournaments/:tournament_id/rounds/:round_number/matches
 * Lấy danh sách các trận đấu của 1 vòng
 */
export const getMatchesByRound = async (req, res) => {
  try {
    // Ưu tiên đọc từ params theo REST: /tournaments/:tournament_id/rounds/:round_number/matches
    // Giữ tương thích ngược với body nếu phía client đang gửi dạng cũ
    const tournament_id = req.params.tournament_id ?? req.body?.tournaments ?? req.body?.tournament_id;
    const round_number = req.params.round_number ?? req.body?.rounds ?? req.body?.round_number;

    // 1️⃣ Kiểm tra giải đấu tồn tại
    const tournament = await models.Tournament.findByPk(tournament_id);
    if (!tournament) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại.'));
    }

    // 2️⃣ Lấy danh sách trận đấu trong vòng
    const matches = await models.Match.findAll({
      where: { tournament_id, round_number },
      include: [
        { model: models.Participant, as: 'teamA', attributes: ['id', 'team_name', 'wallet_address', 'user_id'] },
        { model: models.Participant, as: 'teamB', attributes: ['id', 'team_name', 'wallet_address', 'user_id'] },
        { model: models.Participant, as: 'winner', attributes: ['id', 'team_name'] }
      ],
      order: [['id', 'ASC']]
    });

    // 3️⃣ Thu thập user_id từ teamA và teamB
    const userIds = new Set();
    matches.forEach(m => {
      if (m.teamA?.user_id) userIds.add(m.teamA.user_id);
      if (m.teamB?.user_id) userIds.add(m.teamB.user_id);
    });

    // 4️⃣ Lấy danh sách user (có avatar)
    const users = await userService.findUsersByIds(Array.from(userIds));

    // 5️⃣ Map userId -> avatar URL
    const userMap = new Map();
    users.forEach(u => userMap.set(u.id, u.avatar ? `${backendUrl}${u.avatar}` : null));

    // 6️⃣ Hydrate matches với avatar
    const hydratedMatches = matches.map(match => {
      const data = match.get({ plain: true });
      
      if (data.teamA) {
        data.teamA.avatar = userMap.get(data.teamA.user_id) || null;
      }
      
      if (data.teamB) {
        data.teamB.avatar = userMap.get(data.teamB.user_id) || null;
      }
      
      return data;
    });

    return res.json(responseSuccess({ matches: hydratedMatches }));

  } catch (error) {
    console.error('getMatchesByRound error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const updateMatchScore = async (req, res) => {
  const t = await models.sequelize.transaction();

  try {
    const { match_id } = req.params;
    const { score_team_a, score_team_b } = req.body;

    if (score_team_a === undefined || score_team_b === undefined) {
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_REQUEST_DATA_INVALID,
          'Thiếu score_team_a hoặc score_team_b'
        )
      );
    }

    const a = Number(score_team_a);
    const b = Number(score_team_b);
    if (Number.isNaN(a) || Number.isNaN(b)) {
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_REQUEST_DATA_INVALID,
          'Điểm phải là số hợp lệ'
        )
      );
    }

    // 1. Tìm match
    const match = await models.Match.findByPk(match_id, { transaction: t });
    if (!match) {
      await t.rollback();
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_CODE_DATA_NOT_EXIST,
          'Match không tồn tại'
        )
      );
    }

    // 2. Chỉ cho phép update khi match còn PENDING hoặc COMPLETED
    if (match.status === 'DONE' || match.status === 'CANCELLED') {
      await t.rollback();
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_CODE_DATA_ALREADY_EXIST,
          `Trận đấu đã ${match.status}, không thể cập nhật điểm`
        )
      );
    }

    // 3. Trừ điểm cũ nếu trước đó match đã COMPLETE
    if (match.status === 'COMPLETED') {
      const prevPointA = match.point_team_a || 0;
      const prevPointB = match.point_team_b || 0;

      await models.Participant.increment(
        { total_points: -prevPointA },
        { where: { id: match.team_a_participant_id }, transaction: t }
      );

      await models.Participant.increment(
        { total_points: -prevPointB },
        { where: { id: match.team_b_participant_id }, transaction: t }
      );
    }

    // 4. Tính điểm mới
    let point_team_a, point_team_b;
    let winner_participant_id = null;

    if (a > b) {
      point_team_a = 2;
      point_team_b = 0;
      winner_participant_id = match.team_a_participant_id;
    } else if (b > a) {
      point_team_a = 0;
      point_team_b = 2;
      winner_participant_id = match.team_b_participant_id;
    } else {
      // Hòa
      point_team_a = 1;
      point_team_b = 1;
    }

    // 5. Cập nhật match
    await match.update(
      {
        score_team_a: a,
        score_team_b: b,
        point_team_a,
        point_team_b,
        winner_participant_id,
        status: 'COMPLETED' // Nếu match đang PENDING, chuyển sang COMPLETED
      },
      { transaction: t }
    );

    // 6. Cộng điểm mới
    await models.Participant.increment(
      { total_points: point_team_a },
      { where: { id: match.team_a_participant_id }, transaction: t }
    );

    await models.Participant.increment(
      { total_points: point_team_b },
      { where: { id: match.team_b_participant_id }, transaction: t }
    );

    await t.commit();

    return res.json(
      responseSuccess(
        { match },
        'Cập nhật điểm trận đấu thành công'
      )
    );

  } catch (error) {
    await t.rollback();
    console.error('updateMatchScore error:', error);
    return res.json(
      responseWithError(
        ErrorCodes.ERROR_CODE_SYSTEM_ERROR,
        error.message
      )
    );
  }
};


// ⭐ CẬP NHẬT HÀM START NEXT ROUND
export const startNextRound = async (req, res) => {
  const t = await models.sequelize.transaction();
  try {
    const { tournament_id } = req.params;

    const tournament = await models.Tournament.findByPk(tournament_id, { transaction: t });
    if (!tournament) {
      await t.rollback();
      return res.json(
        responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, "Giải đấu không tồn tại.")
      );
    }

    if (tournament.status === "COMPLETED") {
      await t.rollback();
      return res.json(
        responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, "Giải đấu đã kết thúc.")
      );
    }

    const currentRound = tournament.current_round;

    const incomplete = await models.Match.count({
      where: { tournament_id, round_number: currentRound, status: "PENDING" },
      transaction: t
    });

    if (incomplete > 0) {
      await t.rollback();
      return res.json(
        responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, `Còn ${incomplete} trận chưa hoàn thành.`)
      );
    }

    await models.Match.update(
      { status: "DONE" },
      {
        where: { tournament_id, round_number: currentRound, status: "COMPLETED" },
        transaction: t
      }
    );

    const nextRound = currentRound + 1;

    if (nextRound > tournament.total_rounds) {
      await tournament.update({ status: "COMPLETED" }, { transaction: t });
      await t.commit();
      return res.json(responseSuccess({}, "Giải đấu đã kết thúc."));
    }

    const participants = await models.Participant.findAll({
      where: { tournament_id, status: "APPROVED" },
      transaction: t
    });
    
    if (participants.length < 2) {
      await t.rollback();
      return res.json(
        responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, "Không đủ người chơi để tạo vòng tiếp theo.")
      );
    }

    const matchHistory = await models.Match.findAll({
      where: { tournament_id },
      transaction: t
    });

    // ⭐ Sử dụng thuật toán Swiss cải tiến
    const { pairs, byeTeam } = swissPairing(participants, matchHistory);

    const newMatches = [];
    for (const pair of pairs) {
      newMatches.push({
        tournament_id,
        round_number: nextRound,
        team_a_participant_id: pair[0].id,
        team_b_participant_id: pair[1].id,
        status: "PENDING"
      });
    }

    if (byeTeam) {
      newMatches.push({
        tournament_id,
        round_number: nextRound,
        team_a_participant_id: byeTeam.id,
        team_b_participant_id: null,
        winner_participant_id: byeTeam.id,
        status: "COMPLETED",
        point_team_a: 2,
        point_team_b: 0
      });

      await models.Participant.increment(
        { total_points: 2 },
        { where: { id: byeTeam.id }, transaction: t }
      );

      await models.Participant.update(
        { has_received_bye: true },
        { where: { id: byeTeam.id }, transaction: t }
      );
    }

    await models.Match.bulkCreate(newMatches, { transaction: t });
    await tournament.update({ current_round: nextRound, status: "ACTIVE" }, { transaction: t });

    await t.commit();

    return res.json(
      responseSuccess(
        {
          round_number: nextRound,
          matches_created: newMatches.length,
          total_pairs: pairs.length,
          bye_team: byeTeam?.team_name || null,
          // 🔍 Debug
          debug: {
            total_participants: participants.length,
            expected_matches: Math.floor(participants.length / 2)
          }
        },
        `Đã tạo vòng ${nextRound} thành công.`
      )
    );

  } catch (error) {
    await t.rollback();
    console.error("startNextRound error:", error);
    return res.json(
      responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message)
    );
  }
};


// ⭐ Hàm tính Sonneborn-Berger (SB)
// SB = Σ (Điểm đối thủ × Kết quả trận)
// Thắng = 1.0, Hòa = 0.5, Thua = 0.0
const calculateSonnebornBerger = (participantId, matches, participants) => {
  let sbScore = 0;
  
  matches.forEach(m => {
    let opponentId = null;
    let matchResult = 0; // 0 = thua, 0.5 = hòa, 1 = thắng
    
    if (m.team_a_participant_id === participantId) {
      opponentId = m.team_b_participant_id;
      if (m.winner_participant_id === participantId) {
        matchResult = 1.0;
      } else if (m.winner_participant_id === null) {
        matchResult = 0.5;
      }
    } else if (m.team_b_participant_id === participantId) {
      opponentId = m.team_a_participant_id;
      if (m.winner_participant_id === participantId) {
        matchResult = 1.0;
      } else if (m.winner_participant_id === null) {
        matchResult = 0.5;
      }
    }
    
    if (opponentId) {
      const opponent = participants.find(p => p.id === opponentId);
      if (opponent) {
        sbScore += matchResult * opponent.total_points;
      }
    }
  });
  
  return sbScore;
};

export const writeLeaderboardToBlockchain = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Missing tournamentId'));
    }

    const tournament = await models.Tournament.findByPk(tournamentId);
    if (!tournament) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại'));
    }

    if (tournament.status !== 'COMPLETED') {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Giải đấu chưa kết thúc. Chỉ có thể ghi BXH khi status = COMPLETED'));
    }

    if (tournament.leaderboard_saved === 1) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_ALREADY_EXIST, 'BXH đã được ghi lên blockchain trước đó'));
    }

    const participants = await models.Participant.findAll({
      where: {
        tournament_id: tournamentId,
        status: 'APPROVED'
      },
      attributes: ['id', 'wallet_address', 'total_points', 'team_name'],
      raw: true
    });

    if (!participants || participants.length === 0) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Không có đội tham gia hợp lệ'));
    }

    const validParticipants = participants.filter(p => p.wallet_address && typeof p.total_points === 'number');
    if (validParticipants.length === 0) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Không có participant hợp lệ để ghi blockchain'));
    }

    const matches = await models.Match.findAll({
      where: { tournament_id: tournamentId, status: ['COMPLETED', 'DONE'] },
      attributes: ['team_a_participant_id', 'team_b_participant_id', 'winner_participant_id', 'point_team_a', 'point_team_b'],
      raw: true
    });

    // 🆕 Tính Buchholz, Sonneborn-Berger, và số trận thắng
    const participantStats = validParticipants.map(p => {
      let wins = 0;
      let losses = 0;
      let draws = 0;
      let buchholzScore = 0;
      const opponentIds = new Set();

      matches.forEach(m => {
        if (m.team_a_participant_id === p.id) {
          if (m.team_b_participant_id) opponentIds.add(m.team_b_participant_id);
          if (m.winner_participant_id === p.id) {
            wins++;
          } else if (m.winner_participant_id === null) {
            draws++;
          } else {
            losses++;
          }
        } else if (m.team_b_participant_id === p.id) {
          if (m.team_a_participant_id) opponentIds.add(m.team_a_participant_id);
          if (m.winner_participant_id === p.id) {
            wins++;
          } else if (m.winner_participant_id === null) {
            draws++;
          } else {
            losses++;
          }
        }
      });

      // Tính Buchholz
      opponentIds.forEach(oppId => {
        const opponent = validParticipants.find(vp => vp.id === oppId);
        if (opponent) buchholzScore += opponent.total_points;
      });

      // ⭐ Tính Sonneborn-Berger
      const sonnebornBerger = calculateSonnebornBerger(p.id, matches, validParticipants);
      const totalMatches = wins + losses + draws;

      return {
        ...p,
        wins,
        losses,
        draws,
        buchholzScore,
        sonnebornBerger,
        totalMatches
      };
    });

    // ⭐ Sắp xếp theo thứ tự ưu tiên (5 cấp độ - chắc chắn phân định)
    participantStats.sort((a, b) => {
      // 1. Total Points
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }
      
      // 2. Buchholz Score
      if (b.buchholzScore !== a.buchholzScore) {
        return b.buchholzScore - a.buchholzScore;
      }
      
      // 3. Sonneborn-Berger (key differentiator!)
      if (b.sonnebornBerger !== a.sonnebornBerger) {
        return b.sonnebornBerger - a.sonnebornBerger;
      }
      
      // 4. Wins
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      
      // 5. Total Matches (tiebreaker cuối - đội thi đấu nhiều hơn xếp trên)
      return b.totalMatches - a.totalMatches;
    });

    const participantsArr = participantStats.map(p => p.wallet_address);
    const scoresArr = participantStats.map(p => p.total_points);

    const chainResult = await updateLeaderboardOnChain({
      tournamentId: tournament.id,
      roundNumber: tournament.total_rounds,
      participantsArr,
      scoresArr
    });

    try {
      await tournament.update({ leaderboard_saved: 1 });
    } catch (updErr) {
      console.warn('Could not set leaderboard_saved on tournament', tournament.id, updErr && updErr.message);
    }

    const refreshed = await models.Tournament.findByPk(tournament.id);
    return res.json(responseSuccess({
      tournamentId: tournament.id,
      totalParticipants: participantStats.length,
      onChain: chainResult,
      tournament: refreshed && (refreshed.get ? refreshed.get({ plain: true }) : refreshed),
      // 🔍 Debug: Xem top 5 để kiểm tra tiebreaker
      top5Preview: participantStats.slice(0, 5).map((p, idx) => ({
        rank: idx + 1,
        team: p.team_name,
        points: p.total_points,
        buchholz: p.buchholzScore.toFixed(1),
        sb: p.sonnebornBerger.toFixed(2),
        wins: p.wins,
        totalMatches: p.totalMatches
      }))
    }, 'BXH cuối giải đã được ghi lên blockchain'));

  } catch (error) {
    console.error('writeLeaderboardToBlockchain error:', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

/**
 * ⭐ Lấy BXH cuối giải - CÓ BỔ SUNG SONNEBORN-BERGER
 */
export const getFinalLeaderboard = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Missing tournamentId'));
    }

    const tournament = await models.Tournament.findByPk(tournamentId);
    if (!tournament) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại'));
    }

    if (tournament.status !== 'COMPLETED') {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Giải đấu chưa kết thúc. BXH chỉ khả dụng khi status = COMPLETED'));
    }

    if (tournament.leaderboard_saved !== 1) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'BXH chưa được ghi lên blockchain. Vui lòng gọi API ghi BXH trước'));
    }

    const rawLeaderboard = await getLeaderboardFromChain(Number(tournamentId), tournament.total_rounds);

    const participants = await models.Participant.findAll({
      where: { tournament_id: tournamentId, status: 'APPROVED' },
      attributes: ['id', 'wallet_address', 'total_points', 'team_name', 'user_id'],
      raw: true
    });

    const matches = await models.Match.findAll({
      where: { tournament_id: tournamentId, status: ['COMPLETED', 'DONE'] },
      attributes: ['team_a_participant_id', 'team_b_participant_id', 'winner_participant_id', 'point_team_a', 'point_team_b'],
      raw: true
    });

    // Tính stats bao gồm Sonneborn-Berger
    const participantStats = participants.map(p => {
      let wins = 0;
      let losses = 0;
      let draws = 0;
      let buchholzScore = 0;
      const opponentIds = new Set();

      matches.forEach(m => {
        if (m.team_a_participant_id === p.id) {
          if (m.team_b_participant_id) opponentIds.add(m.team_b_participant_id);
          if (m.winner_participant_id === p.id) {
            wins++;
          } else if (m.winner_participant_id === null) {
            draws++;
          } else {
            losses++;
          }
        } else if (m.team_b_participant_id === p.id) {
          if (m.team_a_participant_id) opponentIds.add(m.team_a_participant_id);
          if (m.winner_participant_id === p.id) {
            wins++;
          } else if (m.winner_participant_id === null) {
            draws++;
          } else {
            losses++;
          }
        }
      });

      opponentIds.forEach(oppId => {
        const opponent = participants.find(vp => vp.id === oppId);
        if (opponent) buchholzScore += opponent.total_points;
      });

      // ⭐ Tính Sonneborn-Berger
      const sonnebornBerger = calculateSonnebornBerger(p.id, matches, participants);

      return {
        wallet_address: p.wallet_address,
        participant_id: p.id,
        team_name: p.team_name,
        user_id: p.user_id,
        total_points: p.total_points,
        wins,
        losses,
        draws,
        buchholzScore,
        sonnebornBerger,
        totalMatches: wins + losses + draws
      };
    });

    // Map blockchain leaderboard với stats
    const leaderboard = await Promise.all(
      rawLeaderboard.map(async (entry, index) => {
        const user = await tournamentService.getUserByWallet(entry.wallet);
        const stats = participantStats.find(s => s.wallet_address === entry.wallet) || {
          wins: 0,
          losses: 0,
          draws: 0,
          buchholzScore: 0,
          sonnebornBerger: 0,
          totalMatches: 0,
          team_name: 'Unknown',
          participant_id: null
        };

        const rawAvatar = user ? user.avatar : null;
        const avatarUrl = normalizeImageUrl(rawAvatar);

        return {
          rank: index + 1,
          wallet: entry.wallet,
          score: entry.score,
          
          // User info
          userId: user ? user.id : null,
          username: user ? user.username : null,
          fullname: user ? user.full_name : null,
          avatar: avatarUrl,
          teamName: stats.team_name,
          
          // ⭐ Statistics với Sonneborn-Berger
          wins: stats.wins,
          losses: stats.losses,
          draws: stats.draws,
          totalMatches: stats.totalMatches,
          buchholzScore: stats.buchholzScore,
          sonnebornBerger: parseFloat(stats.sonnebornBerger.toFixed(2)), // Làm tròn 2 chữ số
          participantId: stats.participant_id
        };
      })
    );

    return res.status(200).json({
      code: 0,
      status: 200,
      message: 'Lấy BXH cuối giải thành công',
      data: {
        tournamentId: Number(tournamentId),
        tournamentName: tournament.name,
        reward_distributed: tournament.reward_distributed ?? 0,
        totalRounds: tournament.total_rounds,
        currentRound: tournament.current_round,
        leaderboard
      }
    });

  } catch (error) {
    console.error('getFinalLeaderboard error:', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const finishRound = async (req, res) => {
  try {
    const { tournament_id, round_number } = req.params;
    const { results } = req.body; // [{ match_id, winner_participant_id, point_team_a, point_team_b }]

    // 1️⃣ Cập nhật trận đấu
    for (const r of results) {
      await models.Match.update({
        winner_participant_id: r.winner_participant_id,
        point_team_a: r.point_team_a,
        point_team_b: r.point_team_b,
        status: 'COMPLETED'
      }, { where: { id: r.match_id } });
    }

    // 2️⃣ Cập nhật tổng điểm participant
    const participants = await models.Participant.findAll({ where: { tournament_id } });
    for (const p of participants) {
      const matches = await models.Match.findAll({
        where: { 
          tournament_id,
          status: 'COMPLETED',
          [Op.or]: [{ team_a_participant_id: p.id }, { team_b_participant_id: p.id }] 
        }
      });
      let total_points = 0;
      matches.forEach(m => {
        if (m.team_a_participant_id === p.id) total_points += m.point_team_a;
        if (m.team_b_participant_id === p.id) total_points += m.point_team_b;
      });
      await p.update({ total_points });
    }

    // 3️⃣ Ghi BXH vòng này lên blockchain

    // Lọc ra những participants CÓ wallet_address hợp lệ
    const validParticipants = participants.filter(p => p.wallet_address);

    // Chỉ map từ những participants đã lọc
    const addresses = validParticipants.map(p => p.wallet_address);

    // Đảm bảo mọi điểm số đều là số. Nếu total_points là null/undefined, mặc định là 0
    const scores = validParticipants.map(p => p.total_points || 0);

    // (Nên thêm) Kiểm tra log trước khi gửi
    console.log("Data sending to blockchain:");
    console.log("Participants (Addresses):", addresses);
    console.log("Scores:", scores);

    // ✅ ĐÚNG: Toàn bộ logic gọi blockchain và cập nhật round nên nằm TRONG if/else
    // Chỉ khi ghi blockchain thành công thì mới cập nhật trạng thái giải đấu
    if (addresses.length > 0) {
      console.log("Ghi BXH vòng lên blockchain...:", tournament_id, tournament.name, round_number, addresses, scores);
      await updateLeaderboardOnChain({
        tournamentId: tournament_id,
        tournamentName: tournament.name,
        roundNumber: parseInt(round_number),
        participants: addresses,
        scores
      });
      
      // 4️⃣ Cập nhật current_round / status
      // ✅ Nên đặt logic này VÀO TRONG khối IF
      // Chỉ khi ghi blockchain xong thì mới chuyển round/kết thúc giải
      const tournament = await models.Tournament.findByPk(tournament_id);
      const nextRound = parseInt(round_number) + 1;
      const isLastRound = nextRound > tournament.total_rounds;

      if (isLastRound) {
        await tournament.update({ status: 'COMPLETED', current_round: round_number });
      } else {
        await tournament.update({ current_round: round_number });
      }

      return res.json({ message: isLastRound ? 'Vòng cuối đã hoàn thành, BXH ghi blockchain' : `Vòng ${round_number} đã hoàn thành` });

    } else {
      console.log("Không có participants hợp lệ nào để ghi lên blockchain.");
      // Nếu không có gì để ghi, bạn có thể vẫn muốn cập nhật round
      // Tùy thuộc vào logic của bạn. Nhưng nếu không có gì để ghi
      // thì cũng không nên báo lỗi, mà chỉ cần trả về thông báo.
      // Dưới đây là ví dụ trả về lỗi:
      return res.status(400).json({ error: "Không có dữ liệu participant hợp lệ để ghi lên blockchain." });
    }

    // ⛔️ ĐÃ XÓA LỆNH GỌI HÀM BỊ TRÙNG LẶP Ở ĐÂY

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
