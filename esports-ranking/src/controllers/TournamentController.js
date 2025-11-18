// File: controllers/tournament.controller.js
import * as tournamentService from '../services/TournamentService.js';
import { responseSuccess, responseWithError } from '../response/ResponseSuccess.js';
import {  updateLeaderboardOnChain, getLeaderboardFromChain, getRegistrationStatus, ethToWei, generateRegistrationSignature, approveRegistration, weiToEth, rejectRegistration } from '../services/BlockchainService.js';
import { ErrorCodes } from '../constant/ErrorCodes.js';
import models from '../models/index.js';
import { isAddress } from 'ethers';
import { Op } from 'sequelize';

// 1. Tạo một giải đấu mới
export const createTournamentWithRewards = async (req, res) => {
  try {
    const { name, total_rounds, rewards, start_date, end_date, registration_fee } = req.body;
    // rewards = [{ rank: 1, reward_amount: 50 }, { rank: 2, reward_amount: 30 }, ...]
    console.log("Creating tournament with data:", req.body);
    if (!name || !total_rounds) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Tên và tổng số vòng là bắt buộc.'));
    }

    if (registration_fee && isNaN(Number(registration_fee))) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Phí đăng ký không hợp lệ.'));
    }

    const existing = await tournamentService.getTournamentByName(name);
    if (existing) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_EXIST, 'Giải đấu đã tồn tại.'));
    }

    const result = await models.sequelize.transaction(async (t) => {
      const tournament = await tournamentService.create({ name, total_rounds, start_date, end_date, registration_fee }, { transaction: t });
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
export const getAllTournaments = async (req, res) => {
  try {
    const { status } = req.query;
    const result = await tournamentService.findAll(status);
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
    const { tournament_id } = req.params;
    const { rewards } = req.body; // [{ rank, reward_amount }]

    if (!Array.isArray(rewards)) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Cần gửi mảng rewards.'));
    }

    // Xóa reward cũ
    await models.TournamentReward.destroy({ where: { tournament_id } });

    // Tạo reward mới
    for (const r of rewards) {
      await models.TournamentReward.create({
        tournament_id,
        rank: r.rank,
        reward_amount: r.reward_amount
      });
    }

    return res.json(responseSuccess(rewards, 'Cập nhật reward thành công'));
  } catch (err) {
    console.error('updateTournamentRewards error', err);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, err.message));
  }
};


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
    if (existingTournament.status !== 'PENDING') {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Không thể xóa giải đấu đang diễn ra hoặc đã kết thúc.'));
    }

    if (existingTournament.participants && existingTournament.participants.length > 0) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, `Không thể xóa giải đấu. Đã có ${existingTournament.participants.length} đội tham gia (kể cả PENDING/REJECTED).`));
    }

    // 3. Gọi Service
    const result = await tournamentService.deleteTournament(id);
    
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
    const { id: user_id } = req.user; // Lấy từ token (middleware checkRole)

    // 1. Kiểm tra Giải đấu
    const tournament = await tournamentService.findById(tournament_id);
    if (!tournament) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại.'));
    }

    // YÊU CẦU: Không request được nữa khi giải đấu bắt đầu
    if (tournament.status !== 'PENDING') {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Giải đấu đã bắt đầu hoặc kết thúc, không thể gửi yêu cầu.'));
    }

    // 2. Kiểm tra Đội (User)
    const team = await tournamentService.findUserById(user_id);
    if (!team) {
      // Điều này hiếm khi xảy ra nếu token hợp lệ
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Đội (User) không tồn tại.'));
    }

    // Kiểm tra User có wallet_address chưa
    if (!team.wallet_address) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Bạn chưa liên kết ví. Vui lòng kết nối MetaMask trước.'));
    }
    
    // 3. Kiểm tra đã request chưa (tránh spam)
    const existingParticipant = await tournamentService.findParticipantByUser(tournament_id, user_id);
    if (existingParticipant) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_EXIST, 'Bạn đã gửi yêu cầu tham gia giải đấu này rồi.'));
    }

    try {
      console.log('Checking blockchain registration status for', team.wallet_address, "id:", tournament_id);
      const blockchainStatus = await getRegistrationStatus(tournament_id, team.wallet_address);
      if (blockchainStatus.status !== 0) { // 0 = None
        return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_EXIST, 'Địa chỉ ví này đã đăng ký trên blockchain.'));
      }
    } catch (error) {
      console.log('Blockchain check passed (user not registered yet)');
    }
    console.log("Blockchain registration status check completed.");
    const registrationFeeInEth = tournament.registration_fee || "0.1"; // Mặc định 0.1 ETH
    const amountInWei = ethToWei(registrationFeeInEth);

    // 5. Tạo chữ ký (Backend ký xác nhận giá tiền)
    const signature = await generateRegistrationSignature(
      team.wallet_address,
      tournament_id,
      amountInWei
    );

    // 4. Tạo request
    const participantData = {
      tournament_id: tournament.id,
      user_id: team.id,
      wallet_address: team.wallet_address,
      team_name: team.full_name,
      status: 'PENDING', // Chờ user gọi Smart Contract
      registration_fee: registrationFeeInEth
    };

    const participant = await tournamentService.createParticipant(participantData);

    // 7. Trả về signature cho Frontend
    return res.json(responseSuccess({
      participant_id: participant.id,
      signature,
      amountInWei,
      amountInEth: registrationFeeInEth,
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
      actor: 'ADMIN',
      type: 'RECEIVE_REFUND',
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
          return {
            ...p.toJSON(),
            blockchain_status: blockchainStatus.statusName,
            blockchain_amount: weiToEth(blockchainStatus.amountDeposited) + ' ETH'
          };
        } catch (error) {
          return {
            ...p.toJSON(),
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






// === Helper: Ghép cặp Swiss ===
const swissPairing = (participants, matchesSoFar) => {
  // --- Sort by total_points DESC ---
  participants.sort((a, b) => b.total_points - a.total_points);

  const pairs = [];
  const used = new Set();

  for (let i = 0; i < participants.length; i++) {
    if (used.has(participants[i].id)) continue;

    for (let j = i + 1; j < participants.length; j++) {
      if (used.has(participants[j].id)) continue;

      // Check if they already played together
      const alreadyPlayed = matchesSoFar.some(
        m =>
          (m.team_a_participant_id === participants[i].id &&
            m.team_b_participant_id === participants[j].id) ||
          (m.team_a_participant_id === participants[j].id &&
            m.team_b_participant_id === participants[i].id)
      );

      if (!alreadyPlayed) {
        pairs.push([participants[i], participants[j]]);
        used.add(participants[i].id);
        used.add(participants[j].id);
        break;
      }
    }
  }

  // Nếu còn 1 đội -> Bye
  const remaining = participants.filter(p => !used.has(p.id));

  // Ưu tiên đội chưa nhận bye
  const byeTeam = remaining.length > 0
    ? remaining.find(t => t.has_received_bye === false) || remaining[0]
    : null;

  return { pairs, byeTeam };
};
// === ADMIN TẠO VÒNG THỤY SĨ ===
// === ADMIN: Bắt đầu giải đấu Thụy Sĩ ===
// Bạn cần import sequelize instance để dùng transaction
// Ví dụ: import models from '../models'; const sequelize = models.sequelize;
// Hoặc import { sequelize } from '../models';

export const startTournamentSwiss = async (req, res) => {
  const t = await models.sequelize.transaction();

  try {
    const { id: tournament_id } = req.params;

    // 🟡 1. Lấy tournament
    const tournament = await models.Tournament.findByPk(tournament_id, { transaction: t });
    if (!tournament) {
      await t.rollback();
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại.'));
    }

    // ⛔ Check status
    if (tournament.status === 'COMPLETED') {
      await t.rollback();
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Giải đấu đã kết thúc.'));
    }

    // 🟡 2. Lấy danh sách team APPROVED
    const participants = await models.Participant.findAll({
      where: { tournament_id, status: 'APPROVED' },
      transaction: t
    });

    if (participants.length < 2) {
      await t.rollback();
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Cần ít nhất 2 đội.'));
    }

    // 🟡 3. Lấy lịch sử match để tránh trùng đối thủ
    const matchesSoFar = await models.Match.findAll({
      where: { tournament_id },
      transaction: t
    });

    // 🟡 4. Xác định round_number
    const round_number =
      matchesSoFar.length === 0
        ? 1
        : Math.max(...matchesSoFar.map(m => m.round_number)) + 1;

    // 🟡 5. Swiss pairing
    const { pairs, byeTeam } = swissPairing(participants, matchesSoFar);

    // 🟡 6. Tạo danh sách match
    const matchesData = pairs.map(pair => ({
      tournament_id,
      round_number,
      team_a_participant_id: pair[0].id,
      team_b_participant_id: pair[1].id,
      status: 'PENDING'
    }));

    // 🟡 7. Xử lý BYE
    if (byeTeam) {
      const BYE_POINTS = 1; // set theo luật bạn muốn

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

      // đánh dấu đã nhận bye
      await models.Participant.update(
        { has_received_bye: true },
        { where: { id: byeTeam.id }, transaction: t }
      );

      // cộng điểm vào total_points
      await models.Participant.increment(
        { total_points: BYE_POINTS },
        { where: { id: byeTeam.id }, transaction: t }
      );
    }

    // 🟡 8. Lưu match
    await models.Match.bulkCreate(matchesData, { transaction: t });

    // 🟡 9. Update tournament
    const updateData =
      tournament.status === 'PENDING'
        ? { status: 'ACTIVE', current_round: round_number }
        : { current_round: round_number };

    await tournament.update(updateData, { transaction: t });

    // 🟢 10. Commit
    await t.commit();

    return res.json(
      responseSuccess(
        {
          round_number,
          matches_created: matchesData.length,
          bye_team: byeTeam?.team_name || null
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
    const { tournaments: tournament_id, rounds: round_number } = req.body;

    // 1️⃣ Kiểm tra giải đấu tồn tại
    const tournament = await models.Tournament.findByPk(tournament_id);
    if (!tournament) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại.'));
    }

    // 2️⃣ Lấy danh sách trận đấu trong vòng
    const matches = await models.Match.findAll({
      where: { tournament_id, round_number },
      include: [
        { model: models.Participant, as: 'teamA', attributes: ['id', 'team_name', 'wallet_address'] },
        { model: models.Participant, as: 'teamB', attributes: ['id', 'team_name', 'wallet_address'] },
        { model: models.Participant, as: 'winner', attributes: ['id', 'team_name'] }
      ],
      order: [['id', 'ASC']]
    });

    return res.json(responseSuccess({ matches }));

  } catch (error) {
    console.error('getMatchesByRound error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const updateMatchScore = async (req, res) => {
  const t = await models.sequelize.transaction();

  try {
    const { match_id } = req.params;
    const { winner_participant_id } = req.body;

    if (!winner_participant_id) {
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_REQUEST_DATA_INVALID,
          'Thiếu winner_participant_id'
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

    // Không cho cập nhật khi đã complete
    if (match.status === 'COMPLETED') {
      await t.rollback();
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_CODE_DATA_ALREADY_EXIST,
          'Trận đấu này đã được cập nhật'
        )
      );
    }

    // 2. Xác định điểm và đội thua
    const WINNER_POINTS = 2;
    const LOSER_POINTS = 1;

    let loser_participant_id;
    let point_team_a;
    let point_team_b;

    if (String(match.team_a_participant_id) === String(winner_participant_id)) {
      // A thắng
      loser_participant_id = match.team_b_participant_id;
      point_team_a = WINNER_POINTS;
      point_team_b = LOSER_POINTS;
    } else if (String(match.team_b_participant_id) === String(winner_participant_id)) {
      // B thắng
      loser_participant_id = match.team_a_participant_id;
      point_team_a = LOSER_POINTS;
      point_team_b = WINNER_POINTS;
    } else {
      await t.rollback();
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_REQUEST_DATA_INVALID,
          'Winner không thuộc trận đấu này'
        )
      );
    }

    // 3. Cập nhật match
    await match.update(
      {
        winner_participant_id,
        point_team_a,
        point_team_b,
        status: 'COMPLETED'
      },
      { transaction: t }
    );

    // 4. Cộng điểm cho người thắng
    await models.Participant.increment(
      { total_points: WINNER_POINTS },
      { where: { id: winner_participant_id }, transaction: t }
    );

    // 5. Cộng điểm cho người thua
    await models.Participant.increment(
      { total_points: LOSER_POINTS },
      { where: { id: loser_participant_id }, transaction: t }
    );

    // 6. Commit
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

export const startNextRound = async (req, res) => {
  try {
    const { tournament_id } = req.params;
    // Tạo transaction để đảm bảo các ghi vào DB là nguyên tử
    const t = await models.sequelize.transaction();

    // 1️⃣ Lấy thông tin tournament
    const tournament = await models.Tournament.findByPk(tournament_id);
    if (!tournament) {
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_CODE_DATA_NOT_EXIST,
          "Giải đấu không tồn tại."
        )
      );
    }

    if (tournament.status === "COMPLETED") {
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_REQUEST_DATA_INVALID,
          "Giải đấu đã kết thúc."
        )
      );
    }

    const currentRound = tournament.current_round;

    // 2️⃣ Kiểm tra vòng hiện tại đã hoàn thành chưa
    const incomplete = await models.Match.count({
      where: {
        tournament_id,
        round_number: currentRound,
        status: "PENDING"
      }
    });

  if (incomplete > 0) {
      await t.rollback();
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_REQUEST_DATA_INVALID,
          `Còn ${incomplete} trận chưa hoàn thành.`
        )
      );
    }

    const nextRound = currentRound + 1;

    // 3️⃣ Kiểm tra vượt số vòng tối đa
    if (nextRound > tournament.total_rounds) {
      await tournament.update({ status: "COMPLETED" });
      return res.json(responseSuccess({}, "Giải đấu đã kết thúc."));
    }

    // 4️⃣ Lấy danh sách participant đã APPROVED
    const participants = await tournamentService.getParticipantsByStatus(
      tournament_id,
      "APPROVED"
    );

    if (participants.length < 2) {
      return res.json(
        responseWithError(
          ErrorCodes.ERROR_REQUEST_DATA_INVALID,
          "Không đủ người chơi để tạo vòng tiếp theo."
        )
      );
    }

    // 5️⃣ Lấy danh sách tất cả trận đã diễn ra
    const matchHistory = await models.Match.findAll({
      where: { tournament_id }
    });

    // 6️⃣ Ghép cặp Swiss
    const { pairs, byeTeam } = swissPairing(participants, matchHistory);

    // 7️⃣ Chuẩn bị danh sách trận mới
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

    // 8️⃣ Xử lý BYE (nếu số người lẻ)
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

      // cộng điểm và gắn flag BYE trong cùng transaction
      await models.Participant.increment(
        { total_points: 2 },
        { where: { id: byeTeam.id } }
      );

      await models.Participant.update(
        { has_received_bye: true },
        { where: { id: byeTeam.id }, transaction: t }
      );
    }

    // 9️⃣ Lưu vào DB trong transaction
    await models.Match.bulkCreate(newMatches, { transaction: t });

    // 🔟 Cập nhật Tournament sang vòng mới (trong transaction)
    await tournament.update({
      current_round: nextRound,
      status: "ACTIVE"
    }, { transaction: t });

    await t.commit();

    return res.json(
      responseSuccess(
        {
          round_number: nextRound,
          matches_created: newMatches.length,
          bye_team: byeTeam?.team_name || null
        },
        `Đã tạo vòng ${nextRound} thành công.`
      )
    );

  } catch (error) {
    console.error("startNextRound error:", error);
    return res.json(
      responseWithError(
        ErrorCodes.ERROR_CODE_SYSTEM_ERROR,
        error.message
      )
    );
  }
};

export const writeLeaderboardToBlockchain = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Missing tournamentId'));
    }

    // 1️⃣ Lấy tournament
    const tournament = await models.Tournament.findByPk(tournamentId);
    if (!tournament) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại'));
    }

    // 2️⃣ Lấy danh sách participant đã APPROVED
    const participants = await models.Participant.findAll({
      where: {
        tournament_id: tournamentId,
        status: 'APPROVED'
      },
      attributes: ['wallet_address', 'total_points'],
      raw: true
    });

    if (!participants || participants.length === 0) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Không có đội tham gia hợp lệ'));
    }

    // 3️⃣ Lọc participant hợp lệ
    const validParticipants = participants.filter(p => p.wallet_address && typeof p.total_points === 'number');
    if (validParticipants.length === 0) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Không có participant hợp lệ để ghi blockchain'));
    }

    // 4️⃣ Sắp xếp theo tổng điểm giảm dần
    validParticipants.sort((a, b) => b.total_points - a.total_points);

    // 5️⃣ Chuẩn bị mảng wallet & scores
    const participantsArr = validParticipants.map(p => p.wallet_address);
    const scoresArr = validParticipants.map(p => p.total_points);

    // 6️⃣ Ghi lên blockchain
    const chainResult = await updateLeaderboardOnChain({
      tournamentId: tournament.id,
      roundNumber: 999, // round đặc biệt cuối giải
      participantsArr,
      scoresArr
    });

    // 7️⃣ Trả về kết quả
    return res.json(responseSuccess({
      tournamentId: tournament.id,
      totalParticipants: validParticipants.length,
      onChain: chainResult
    }, 'BXH cuối giải đã được ghi lên blockchain'));

  } catch (error) {
    console.error('writeLeaderboardToBlockchain error:', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

/**
 * Lấy BXH cuối giải từ blockchain
 */
export const getFinalLeaderboard = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Missing tournamentId'));
    }
    console.log("test", tournamentId);

    // Lấy BXH cuối từ blockchain
    const rawLeaderboard = await getLeaderboardFromChain(
      Number(tournamentId),
      999
    );

    console.log("Blockchain leaderboard:", rawLeaderboard);

    // Map thêm thông tin user
    const leaderboard = await Promise.all(
      rawLeaderboard.map(async (entry) => {
        const user = await tournamentService.getUserByWallet(entry.wallet);

        return {
          wallet: entry.wallet,
          score: entry.score,

          userId: user ? user.id : null,
          username: user ? user.username : null,
          fullname: user ? user.full_name : null,
          avatar: user ? user.avatar : null, // nếu có
        };
      })
    );
    return res.status(200).json({
      code: 0,
      status: 200,
      message: 'Lấy BXH cuối giải thành công',
      data: {
        tournamentId: Number(tournamentId),
        leaderboard
      }
    });

  } catch (error) {
    console.error('getFinalLeaderboard error:', error);
    return responseWithError(res, 500, error.message);
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
