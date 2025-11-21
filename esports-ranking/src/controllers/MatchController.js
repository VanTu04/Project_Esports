// File: controllers/match.controller.js
import * as matchService from '../services/MatchService.js';
import * as tournamentService from '../services/TournamentService.js';
import { responseSuccess, responseWithError } from '../response/ResponseSuccess.js';
import { ErrorCodes } from '../constant/ErrorCodes.js';
import models from '../models/index.js';
import * as userService from '../services/UserService.js';

// === YÊU CẦU 1: LẤY LỊCH THI ĐẤU (VỚI TÊN) ===
export const getAllMatches = async (req, res) => {
  try {
    const query = req.query;

    if (!query.tournament_id || !query.round_number) {
      return res.json(responseWithError(
        ErrorCodes.ERROR_REQUEST_DATA_INVALID,
        'Bắt buộc phải cung cấp tournament_id và round_number.'
      ));
    }

    // 1. Lấy danh sách trận đấu
    const matches = await matchService.findAll(query);

    if (matches.length === 0) {
      return res.json(responseSuccess([], "Không tìm thấy trận đấu nào."));
    }

    // 2. Thu thập participant_id
    const participantIds = new Set();
    matches.forEach(m => {
      participantIds.add(m.team_a_participant_id);
      if (m.team_b_participant_id) participantIds.add(m.team_b_participant_id);
    });

    // 3. Lấy danh sách participant
    const participants = await tournamentService.findParticipantsByIds(
      Array.from(participantIds)
    );

    // 4. Lấy danh sách user_id từ participant
    const userIds = participants.map(p => p.user_id);

    // 5. Lấy danh sách user (có avatar)
    const users = await userService.findUsersByIds(userIds);

    // 6. Map userId -> avatar
    const userMap = new Map();
    users.forEach(u => userMap.set(u.id, u.avatar));

    // 7. Map participantId → team_name + avatar
    const participantMap = new Map();
    participants.forEach(p => {
      participantMap.set(p.id, {
        team_name: p.team_name,
        avatar: userMap.get(p.user_id) || null
      });
    });

    // 8. Hydrate dữ liệu trả về
    const hydratedMatches = matches.map(match => {
      const data = match.get({ plain: true });

      const teamA = participantMap.get(match.team_a_participant_id);
      const teamB = participantMap.get(match.team_b_participant_id);

      data.team_a_name = teamA?.team_name || "N/A";
      data.team_a_avatar = teamA?.avatar || null;

      data.team_b_name = teamB?.team_name || "BYE";
      data.team_b_avatar = teamB?.avatar || null;

      return data;
    });

    return res.json(responseSuccess(hydratedMatches, "Lấy danh sách trận đấu thành công"));

  } catch (error) {
    console.error("getAllMatches error", error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const reportMatchResult = async (req, res) => {
  const { id: match_id } = req.params;
  const { winner_participant_id } = req.body;

  // Transaction DB
  const t = await models.sequelize.transaction();

  try {
    // 1. Validation
    if (!winner_participant_id) {
      return res.json(responseWithError(
        ErrorCodes.ERROR_REQUEST_DATA_INVALID, 
        'winner_participant_id là bắt buộc.'
      ));
    }

    // 2. Lấy trận đấu
    const match = await matchService.findMatchById(match_id);
    if (!match) {
      return res.json(responseWithError(
        ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 
        'Trận đấu không tồn tại.'
      ));
    }

    // 3. Xác định team thắng/thua
    const teamA_id = match.team_a_participant_id;
    const teamB_id = match.team_b_participant_id;
    let loser_participant_id = null;

    if (Number(winner_participant_id) === teamA_id) {
      loser_participant_id = teamB_id;
    } else if (Number(winner_participant_id) === teamB_id) {
      loser_participant_id = teamA_id;
    } else {
      return res.json(responseWithError(
        ErrorCodes.ERROR_REQUEST_DATA_INVALID, 
        'Người thắng không hợp lệ cho trận đấu này.'
      ));
    }

    // 4. Lấy thông tin ví
    const winner = await tournamentService.findParticipantById(winner_participant_id);
    const loser = await tournamentService.findParticipantById(loser_participant_id);
    if (!winner || !loser) {
      return res.json(responseWithError(
        ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 
        'Không tìm thấy thông tin đội tham gia.'
      ));
    }

    // 5. Tính điểm: Thắng 2 điểm, Thua 1 điểm
    const scoreA = Number(winner_participant_id) === teamA_id ? 2 : 1;
    const scoreB = Number(winner_participant_id) === teamB_id ? 2 : 1;

    // 6. Cập nhật điểm lên blockchain
    // NOTE: Contract hiện tại chỉ hỗ trợ updateRoundLeaderboard, không có updateMatchScore
    // Blockchain sẽ được cập nhật khi kết thúc round thông qua updateRoundLeaderboard
    // await updateMatchScoreOnChain(match_id, scoreA, scoreB);

    // 7. Cập nhật CSDL (bao gồm score_a và score_b)
    await match.update({
      winner_participant_id,
      score_a: scoreA,
      score_b: scoreB,
      status: 'COMPLETED'
    }, { transaction: t });

    // 8. Commit
    await t.commit();

    return res.json(responseSuccess({
      winner_participant_id,
      score_a: scoreA,
      score_b: scoreB
    }, 'Báo cáo kết quả thành công. Điểm sẽ được cập nhật lên blockchain khi kết thúc vòng đấu.'));
  } catch (error) {
    await t.rollback();
    console.error('reportMatchResult error:', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

// === YÊU CẦU 2: CẬP NHẬT THỜI GIAN THI ĐẤU ===
export const scheduleMatchTime = async (req, res) => {
  try {
    const { id: match_id } = req.params;
    const { match_time } = req.body; // Ví dụ: "2025-12-10T19:00:00.000Z"

    if (!match_time) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'match_time (thời gian) là bắt buộc.'));
    }

    // 1. Tìm trận đấu
    const match = await matchService.findMatchById(match_id);
    if (!match) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Trận đấu không tồn tại.'));
    }

    // 2. Chỉ cho phép gán lịch khi đang PENDING
    if (match.status !== 'PENDING') {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Không thể gán lịch cho trận đấu đã kết thúc.'));
    }

    // 3. Gọi Service
    await matchService.scheduleTime(match, match_time);

    return res.json(responseSuccess(true, 'Cập nhật lịch thi đấu thành công'));

  } catch (error) {
    console.error('scheduleMatchTime error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const getMatchScore = async (req, res) => {
  try {
    const { matchId } = req.params;
    const score = await getMatchScoreFromChain(Number(matchId));
    return res.json(responseSuccess(score, "Lấy điểm trận thành công"));
  } catch (error) {
    console.error("getMatchScore error:", error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const getMatchesByTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const matches = await getMatchesByTournamentFromChain(Number(tournamentId));

    if (!matches || matches.length === 0) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, "Chưa có trận đấu nào"));
    }

    return res.json(responseSuccess(matches, "Lấy danh sách trận đấu thành công"));
  } catch (error) {
    console.error("getMatchesByTournament error:", error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};