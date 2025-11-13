// File: controllers/tournament.controller.js
import * as tournamentService from '../services/TournamentService.js';
import { responseSuccess, responseWithError } from '../response/ResponseSuccess.js';
import { updateLeaderboardOnChain } from '../services/BlockchainService.js';
import { ErrorCodes } from '../constant/ErrorCodes.js';
import models from '../models/index.js';

// 1. Tạo một giải đấu mới
export const createTournamentWithRewards = async (req, res) => {
  try {
    const { name, total_rounds, rewards } = req.body;
    // rewards = [{ rank: 1, reward_amount: 50 }, { rank: 2, reward_amount: 30 }, ...]
    
    if (!name || !total_rounds) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Tên và tổng số vòng là bắt buộc.'));
    }

    const existing = await tournamentService.getTournamentByName(name);
    if (existing) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_EXIST, 'Giải đấu đã tồn tại.'));
    }

    const tournament = await tournamentService.create({ name, total_rounds });

    // Tạo reward tiers
    if (Array.isArray(rewards) && rewards.length > 0) {
      for (const r of rewards) {
        await models.TournamentReward.create({
          tournament_id: tournament.id,
          rank: r.rank,
          reward_amount: r.reward_amount
        });
      }
    }

    return res.json(responseSuccess(tournament, 'Tạo giải đấu và reward thành công'));
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
    
    // 3. Kiểm tra đã request chưa (tránh spam)
    const existingParticipant = await tournamentService.findParticipantByUser(tournament_id, user_id);
    if (existingParticipant) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_EXIST, 'Bạn đã gửi yêu cầu tham gia giải đấu này rồi.'));
    }

    // 4. Tạo request
    const participantData = {
      tournament_id: tournament.id,
      user_id: team.id,
      wallet_address: team.wallet_address,
      team_name: team.full_name,
      status: 'PENDING' // Mấu chốt
    };

    const result = await tournamentService.createParticipant(participantData);
    return res.json(responseSuccess(result, 'Gửi yêu cầu tham gia thành công. Chờ Admin duyệt.'));

  } catch (error) {
    console.error('requestJoinTournament error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

// ADMIN DUYỆT / TỪ CHỐI YÊU CẦU THAM GIA
export const reviewJoinRequest = async (req, res) => {
  try {
    const { participant_id } = req.params;
    const { action } = req.body; // 'approve' hoặc 'reject'

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Hành động (action) không hợp lệ. Phải là "approve" hoặc "reject".'));
    }

    // 1. Tìm request
    const participant = await tournamentService.findParticipantById(participant_id);
    if (!participant) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Không tìm thấy yêu cầu tham gia.'));
    }

    // 2. Kiểm tra logic
    if (participant.status !== 'PENDING') {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Yêu cầu này đã được xử lý trước đó.'));
    }

    // 3. Cập nhật (Đây là logic "updateGame" của bạn)
    const newStatus = (action === 'APPROVE') ? 'APPROVED' : 'REJECTED';
    await participant.update({ status: newStatus }); // Dùng instance.update()

    return res.json(responseSuccess(participant, `Đã ${action} yêu cầu thành công.`));

  } catch (error) {
    console.error('reviewJoinRequest error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};


// === Helper: Ghép cặp Swiss ===
const swissPairing = (participants, matchesSoFar) => {
  participants.sort((a, b) => b.total_points - a.total_points); // Giảm dần
  const pairs = [];
  const used = new Set();

  for (let i = 0; i < participants.length; i++) {
    if (used.has(participants[i].id)) continue;
    for (let j = i + 1; j < participants.length; j++) {
      if (used.has(participants[j].id)) continue;
      const alreadyPlayed = matchesSoFar.some(
        m => (m.team_a_participant_id === participants[i].id && m.team_b_participant_id === participants[j].id) ||
             (m.team_a_participant_id === participants[j].id && m.team_b_participant_id === participants[i].id)
      );
      if (!alreadyPlayed) {
        pairs.push([participants[i], participants[j]]);
        used.add(participants[i].id);
        used.add(participants[j].id);
        break;
      }
    }
  }

  const remaining = participants.filter(p => !used.has(p.id));
  const byeTeam = remaining.length > 0 ? remaining[0] : null;
  return { pairs, byeTeam };
};

// === ADMIN TẠO VÒNG THỤY SĨ ===
// === ADMIN: Bắt đầu giải đấu Thụy Sĩ ===
export const startTournamentSwiss = async (req, res) => {
  try {
    const { id: tournament_id } = req.params;

    // 1️⃣ Lấy tournament (instance Sequelize)
    const tournament = await models.Tournament.findByPk(tournament_id);
    if (!tournament) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại.'));
    }

    // 2️⃣ Kiểm tra trạng thái
    if (tournament.status === 'COMPLETED') {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Giải đấu đã kết thúc.'));
    }

    // 3️⃣ Lấy các participant đã được duyệt
    const participants = await tournamentService.getParticipantsByStatus(tournament_id, 'APPROVED');
    if (participants.length < 2) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Cần ít nhất 2 đội để bắt đầu.'));
    }

    // 4️⃣ Lấy các match đã tồn tại trong giải
    const matchesSoFar = await models.Match.findAll({ where: { tournament_id } });

    // 5️⃣ Ghép cặp theo Swiss
    const { pairs, byeTeam } = swissPairing(participants, matchesSoFar);

    // 6️⃣ Xác định số vòng hiện tại
    const round_number = (matchesSoFar.length === 0)
      ? 1
      : Math.max(...matchesSoFar.map(m => m.round_number)) + 1;

    // 7️⃣ Chuẩn bị dữ liệu match mới
    const matchesData = pairs.map(pair => ({
      tournament_id,
      round_number,
      team_a_participant_id: pair[0].id,
      team_b_participant_id: pair[1].id,
      status: 'PENDING'
    }));

    // 8️⃣ Xử lý đội Bye (nếu có)
    if (byeTeam) {
      matchesData.push({
        tournament_id,
        round_number,
        team_a_participant_id: byeTeam.id,
        team_b_participant_id: null,
        winner_participant_id: byeTeam.id,
        status: 'COMPLETED'
      });

      // đánh dấu participant đã nhận bye
      await tournamentService.markParticipantBye(byeTeam.id);
    }

    // 9️⃣ Lưu match vào DB
    await tournamentService.createMatches(matchesData);

    // 10️⃣ Cập nhật trạng thái tournament nếu đang PENDING
    if (tournament.status === 'PENDING') {
      await tournament.update({ status: 'ACTIVE', current_round: round_number });
    } else {
      await tournament.update({ current_round: round_number });
    }

    return res.json(responseSuccess({
      round_number,
      matches_created: matchesData.length,
      bye_team: byeTeam?.team_name || null
    }, `Vòng ${round_number} đã tạo thành công.`));

  } catch (error) {
    console.error('startTournamentSwiss error', error);
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
  try {
    const { match_id } = req.params;
    const { point_team_a, point_team_b, winner_participant_id } = req.body;

    if (point_team_a == null || point_team_b == null || !winner_participant_id) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Thiếu điểm hoặc winner'));
    }

    // 1️⃣ Lấy match
    const match = await models.Match.findByPk(match_id);
    if (!match) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Match không tồn tại'));
    }

    // 2️⃣ Cập nhật điểm và winner
    await match.update({
      point_team_a,
      point_team_b,
      winner_participant_id,
      status: 'COMPLETED'
    });

    return res.json(responseSuccess({ match }, 'Cập nhật điểm trận đấu thành công'));

  } catch (error) {
    console.error('updateMatchScore error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const startNextRound = async (req, res) => {
  try {
    const { tournament_id } = req.params;

    // 1️⃣ Lấy tournament
    const tournament = await models.Tournament.findByPk(tournament_id);
    if (!tournament) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại.'));
    }

    if (tournament.status === 'COMPLETED') {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Giải đấu đã kết thúc.'));
    }

    const currentRound = tournament.current_round;

    // 2️⃣ Kiểm tra tất cả trận của vòng hiện tại đã COMPLETED chưa
    const incompleteMatches = await models.Match.findAll({
      where: { tournament_id, round_number: currentRound, status: 'PENDING' }
    });

    if (incompleteMatches.length > 0) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, `Vẫn còn ${incompleteMatches.length} trận chưa hoàn tất.`));
    }

    const nextRound = currentRound + 1;

    // 3️⃣ Kiểm tra vượt quá total_rounds
    if (nextRound > tournament.total_rounds) {
      await tournament.update({ status: 'COMPLETED' });
      return res.json(responseSuccess({ message: 'Giải đấu đã kết thúc.' }));
    }

    // 4️⃣ Lấy participants đã APPROVED
    const participants = await tournamentService.getParticipantsByStatus(tournament_id, 'APPROVED');

    // 5️⃣ Lấy tất cả match đã có để tính già ghép cặp
    const matchesSoFar = await models.Match.findAll({ where: { tournament_id } });

    // 6️⃣ Ghép cặp Swiss
    const { pairs, byeTeam } = swissPairing(participants, matchesSoFar);

    // 7️⃣ Tạo match cho vòng tiếp theo
    const matchesData = pairs.map(pair => ({
      tournament_id,
      round_number: nextRound,
      team_a_participant_id: pair[0].id,
      team_b_participant_id: pair[1].id,
      status: 'PENDING'
    }));

    // 8️⃣ Xử lý bye
    if (byeTeam) {
      matchesData.push({
        tournament_id,
        round_number: nextRound,
        team_a_participant_id: byeTeam.id,
        team_b_participant_id: null,
        winner_participant_id: byeTeam.id,
        status: 'COMPLETED'
      });

      await tournamentService.markParticipantBye(byeTeam.id);
    }

    // 9️⃣ Lưu match mới
    await tournamentService.createMatches(matchesData);

    // 10️⃣ Cập nhật current_round
    await tournament.update({ current_round: nextRound, status: 'ACTIVE' });

    return res.json(responseSuccess({
      round_number: nextRound,
      matches_created: matchesData.length,
      bye_team: byeTeam?.team_name || null
    }, `Vòng ${nextRound} đã tạo thành công.`));

  } catch (error) {
    console.error('startNextRound error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const writeLeaderboardToBlockchain = async (tournamentId, roundNumber) => {
  // 1️⃣ Lấy tournament
  const tournament = await models.Tournament.findByPk(tournamentId);
  if (!tournament) throw new Error('Tournament not found');

  // 2️⃣ Lấy participant và tính tổng điểm
  const participants = await models.Participant.findAll({ where: { tournament_id: tournamentId } });

  for (const p of participants) {
    const matches = await models.Match.findAll({
      where: {
        tournament_id: tournamentId,
        status: 'COMPLETED',
        [Op.or]: [
          { team_a_participant_id: p.id },
          { team_b_participant_id: p.id }
        ]
      }
    });

    let totalPoints = 0;
    matches.forEach(m => {
      if (m.team_a_participant_id === p.id) totalPoints += m.point_team_a;
      if (m.team_b_participant_id === p.id) totalPoints += m.point_team_b;
    });

    await p.update({ total_points: totalPoints });
  }

  // 3️⃣ Tạo BXH và sort
  const leaderboard = participants.map(async p => ({
    participant_id: p.id,
    team_name: p.team_name,
    wallet_address: p.wallet_address,
    total_points: p.total_points,
    matches_won: await models.Match.count({ 
      where: { winner_participant_id: p.id, tournament_id: tournamentId } 
    })
  }));

  leaderboard.sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    return b.matches_won - a.matches_won;
  });

  // 4️⃣ Ghi lên blockchain
  await updateLeaderboardOnChain({
    tournamentId,
    tournamentName: tournament.name,
    roundNumber,
    leaderboard
  });

  return { leaderboard };
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
    const addresses = participants.map(p => p.wallet_address);
    const scores = participants.map(p => p.total_points);

    await updateLeaderboardOnChain({
      tournamentId: tournament_id,
      tournamentName: "TBD", // tên giải có thể lấy từ DB
      roundNumber: parseInt(round_number),
      participants: addresses,
      scores
    });

    // 4️⃣ Cập nhật current_round / status
    const tournament = await models.Tournament.findByPk(tournament_id);
    const nextRound = parseInt(round_number) + 1;
    const isLastRound = nextRound > tournament.total_rounds;

    if (isLastRound) {
      await tournament.update({ status: 'COMPLETED', current_round: round_number });
    } else {
      await tournament.update({ current_round: round_number });
    }

    return res.json({ message: isLastRound ? 'Vòng cuối đã hoàn thành, BXH ghi blockchain' : `Vòng ${round_number} đã hoàn thành` });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

