// File: controllers/match.controller.js
import * as matchService from '../services/MatchService.js';
import * as tournamentService from '../services/TournamentService.js';
import { responseSuccess, responseWithError } from '../response/ResponseSuccess.js';
import { ErrorCodes } from '../constant/ErrorCodes.js';
import models from '../models/index.js';

// === YÊU CẦU 1: LẤY LỊCH THI ĐẤU (VỚI TÊN) ===
export const getAllMatches = async (req, res) => {
  try {
    const query = req.query; // { tournament_id, round_number }

    if (!query.tournament_id || !query.round_number) {
        return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Bắt buộc phải cung cấp tournament_id và round_number.'));
    }
    
    // 1. Service "mỏng" lấy các trận đấu (chỉ ID)
    const matches = await matchService.findAll(query);

    if (matches.length === 0) {
      return res.json(responseSuccess([], "Không tìm thấy trận đấu nào."));
    }

    // 2. Controller: Thu thập TẤT CẢ ID đội
    const participantIds = new Set(); // Dùng Set để tránh lặp ID
    matches.forEach(match => {
      participantIds.add(match.team_a_participant_id);
      if (match.team_b_participant_id) { // (Tránh trận "Bye")
        participantIds.add(match.team_b_participant_id);
      }
    });

    // 3. Gọi service 1 LẦN để lấy TẤT CẢ tên
    const participants = await tournamentService.findParticipantsByIds(Array.from(participantIds));

    // 4. Tạo một "bản đồ" (Map) để tra cứu tên (tối ưu hiệu suất)
    const participantMap = new Map();
    participants.forEach(p => {
      participantMap.set(p.id, p.team_name);
    });

    // 5. "Gắn" tên vào kết quả trả về
    const hydratedMatches = matches.map(match => {
      // Dùng .get({ plain: true }) để lấy đối tượng thuần
      const matchData = match.get({ plain: true });

      // Gắn tên
      matchData.team_a_name = participantMap.get(match.team_a_participant_id) || 'N/A';
      matchData.team_b_name = participantMap.get(match.team_b_participant_id) || 'BYE'; // Nếu team_b_id là null

      return matchData;
    });

    return res.json(responseSuccess(hydratedMatches, "Lấy danh sách trận đấu thành công"));

  } catch (error) {
    console.error('getAllMatches error', error);
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

    // 5. Cập nhật điểm lên blockchain (gọi contract mới)
    // Thắng 2 điểm, Thua 1 điểm
    // Nếu trận đã cập nhật trước đó, admin vẫn có thể ghi lại -> tạo block mới
    await updateMatchScoreOnChain(match_id, 
      Number(match_id) === teamA_id ? 2 : 1, // scoreA
      Number(match_id) === teamB_id ? 2 : 1  // scoreB
    );

    // 6. Cập nhật CSDL
    await match.update({
      winner_participant_id,
      status: 'COMPLETED'
    }, { transaction: t });

    // 7. Commit
    await t.commit();

    return res.json(responseSuccess(true, 'Báo cáo kết quả thành công. Điểm đã được cập nhật trên blockchain.'));
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