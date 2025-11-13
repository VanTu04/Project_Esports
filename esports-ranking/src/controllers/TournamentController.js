// File: controllers/tournament.controller.js
import * as tournamentService from '../services/TournamentService.js';
import { updateMatchScoreOnChain } from '../services/BlockchainService.js';
import { responseSuccess, responseWithError } from '../response/ResponseSuccess.js';
import { ErrorCodes } from '../constant/ErrorCodes.js';
import models from '../models/index.js';

// 1. Tạo một giải đấu mới
export const createTournament = async (req, res) => {
  try {
    const data = req.body;
    // const created_by = req.user.id; // Lấy từ auth middleware

    // 1. Validation (Giống GameController)
    if (!data.name || !data.total_rounds) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Tên và Tổng số vòng là bắt buộc.'));
    }

    // 2. Existence Check (Giống GameController)
    const existing = await tournamentService.getTournamentByName(data.name);
    if (existing) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_EXIST, 'Giải đấu với tên này đã tồn tại.'));
    }

    // 3. Gán thêm dữ liệu (nếu cần)
    // data.created_by = created_by;

    // 4. Gọi Service
    const result = await tournamentService.create(data);
    return res.json(responseSuccess(result, 'Tạo giải đấu thành công'));

  } catch (error) {
    console.error('createTournament error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
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

export const updateTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!data.name && !data.total_rounds && !data.status) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Cần ít nhất một trường để cập nhật.'));
    }

    const existingTournament = await tournamentService.findById(id);
    if (!existingTournament) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Giải đấu không tồn tại.'));
    }

    if (existingTournament.status === 'ACTIVE' || existingTournament.status === 'COMPLETED') { // Giả sử status 'ACTIVE'
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Không thể cập nhật giải đấu đang diễn ra hoặc đã kết thúc.'));
    }
    if (data.name && data.name !== existingTournament.name) {
      const duplicate = await tournamentService.getTournamentByName(data.name);
      if (duplicate) {
        return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_EXIST, 'Tên giải đấu này đã được sử dụng.'));
      }
    }

    const tournamentInstance = await models.Tournament.findByPk(id);
    if (!tournamentInstance) {
       // Điều này gần như không thể xảy ra nếu 'existingTournament' tồn tại
       return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi: Không tìm thấy instance giải đấu để cập nhật.'));
    }

    const result = await tournamentService.update(tournamentInstance, data);
    return res.json(responseSuccess(result, 'Cập nhật giải đấu thành công'));

  } catch (error) {
    console.error('updateTournament error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
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

// === KẾT THÚC GIẢI ĐẤU ===
export const finishTournamentSwiss = async (req, res) => {
  try {
    const { id: tournament_id } = req.params;

    // 1. Lấy tournament
    const tournament = await tournamentService.findById(tournament_id);
    if (!tournament || tournament.status === 'COMPLETED') {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Giải đấu không tồn tại hoặc đã kết thúc.'));
    }

    // 2. Lấy tất cả participants
    const participants = await tournamentService.getParticipantsByStatus(tournament_id, 'APPROVED');
    for (const p of participants) {
      p.total_points = await getScoreFromContract(p.wallet_address);
    }

    // 3. Xếp hạng theo điểm giảm dần
    participants.sort((a, b) => b.total_points - a.total_points);

    // 4. Cập nhật trạng thái tournament COMPLETED
    const tournamentInstance = await models.Tournament.findByPk(tournament_id);
    await tournamentService.updateTournamentStatus(tournamentInstance, 'COMPLETED');

    return res.json(responseSuccess({
      leaderboard: participants.map((p, idx) => ({
        rank: idx + 1,
        id: p.id,
        team_name: p.team_name,
        wallet: p.wallet_address,
        total_points: p.total_points
      }))
    }, 'Giải đấu đã kết thúc, xếp hạng đã tạo thành công.'));

  } catch (error) {
    console.error('finishTournamentSwiss error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};


// === LẤY KẾT QUẢ TỪNG VÒNG THEO GIẢI ĐẤU ===
export const getTournamentRoundsResult = async (req, res) => {
  try {
    const { id: tournament_id } = req.params;

    // Lấy tất cả các trận đấu theo giải, sắp theo vòng
    const matches = await models.Match.findAll({
      where: { tournament_id },
      include: [
        { model: models.Participant, as: 'teamA', attributes: ['id', 'team_name', 'wallet_address'] },
        { model: models.Participant, as: 'teamB', attributes: ['id', 'team_name', 'wallet_address'] },
        { model: models.Participant, as: 'winner', attributes: ['id', 'team_name', 'wallet_address'] }
      ],
      order: [['round_number', 'ASC'], ['id', 'ASC']]
    });

    if (!matches.length) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Chưa có trận đấu nào.'));
    }

    // Gom nhóm theo round_number
    const rounds = {};
    for (const match of matches) {
      const round = match.round_number;
      if (!rounds[round]) rounds[round] = [];

      // Lấy điểm mới nhất từ blockchain (cho từng đội)
      const teamAScore = match.teamA?.wallet_address
        ? await getScoreFromContract(match.teamA.wallet_address)
        : 0;
      const teamBScore = match.teamB?.wallet_address
        ? await getScoreFromContract(match.teamB.wallet_address)
        : 0;

      // Định dạng dữ liệu
      rounds[round].push({
        match_id: match.id,
        status: match.status,
        winner: match.winner?.team_name || null,
        teams: [
          {
            id: match.teamA?.id,
            name: match.teamA?.team_name,
            wallet: match.teamA?.wallet_address,
            blockchain_score: teamAScore
          },
          {
            id: match.teamB?.id,
            name: match.teamB?.team_name,
            wallet: match.teamB?.wallet_address,
            blockchain_score: teamBScore
          }
        ]
      });
    }

    // Trả về kết quả
    return res.json(responseSuccess(rounds, 'Lấy kết quả từng vòng thành công.'));
  } catch (error) {
    console.error('getTournamentRoundsResult error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

// === LẤY BẢNG XẾP HẠNG TỪ KẾT QUẢ TỪNG VÒNG ===
export const getTournamentLeaderboard = async (req, res) => {
  try {
    const { id: tournament_id } = req.params;

    // 1. Lấy tất cả trận đấu COMPLETED của giải
    const matches = await models.Match.findAll({
      where: {
        tournament_id,
        status: 'COMPLETED'
      },
      include: [
        { model: models.Participant, as: 'teamA', attributes: ['id', 'team_name', 'wallet_address'] },
        { model: models.Participant, as: 'teamB', attributes: ['id', 'team_name', 'wallet_address'] }
      ]
    });

    if (!matches.length) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Chưa có trận đấu nào hoàn tất.'));
    }

    // 2. Tạo map teamId -> tổng điểm
    const leaderboardMap = new Map();

    for (const match of matches) {
      const teams = [match.teamA, match.teamB].filter(Boolean);

      for (const team of teams) {
        if (!team.wallet_address) continue;

        let total = leaderboardMap.get(team.id) || 0;
        const blockchainScore = await getScoreFromContract(team.wallet_address);
        total = blockchainScore; // Lấy điểm mới nhất từ blockchain
        leaderboardMap.set(team.id, { ...team.get({ plain: true }), total_points: total });
      }
    }

    // 3. Chuyển map thành array và sắp xếp giảm dần
    const leaderboard = Array.from(leaderboardMap.values()).sort((a, b) => b.total_points - a.total_points);

    // 4. Gán rank
    const rankedLeaderboard = leaderboard.map((team, idx) => ({
      rank: idx + 1,
      id: team.id,
      team_name: team.team_name,
      wallet: team.wallet_address,
      total_points: team.total_points
    }));

    return res.json(responseSuccess(rankedLeaderboard, 'Lấy bảng xếp hạng thành công.'));

  } catch (error) {
    console.error('getTournamentLeaderboard error:', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};
