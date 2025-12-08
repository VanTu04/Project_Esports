// File: controllers/match.controller.js
import * as matchService from '../services/MatchService.js';
import * as tournamentService from '../services/TournamentService.js';
import { responseSuccess, responseWithError } from '../response/ResponseSuccess.js';
import { ErrorCodes } from '../constant/ErrorCodes.js';
import models from '../models/index.js';
import * as userService from '../services/UserService.js';

const backendUrl = process.env.BACKEND_URL || 'https://api.vawndev.online';

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

    console.log("get participants:", participants);
    // 4. Lấy danh sách user_id từ participant
    const userIds = participants.map(p => p.user_id);

    // 5. Lấy danh sách user (có avatar)
    const users = await userService.findUsersByIds(userIds);

    // 6. Map userId -> avatar
    const userMap = new Map();
    users.forEach(u => userMap.set(u.id, u.avatar ? `${backendUrl}${u.avatar}` : null));

    console.log("userMap:", userMap);
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
    const pointA = Number(winner_participant_id) === teamA_id ? 2 : 1;
    const pointB = Number(winner_participant_id) === teamB_id ? 2 : 1;

    // Score là tỷ số thắng thua (có thể lấy từ body nếu cần chi tiết hơn)
    const { score_team_a = 1, score_team_b = 0 } = req.body; // Mặc định thắng 1-0

    // 6. Cập nhật điểm lên blockchain
    // NOTE: Contract hiện tại chỉ hỗ trợ updateRoundLeaderboard, không có updateMatchScore
    // Blockchain sẽ được cập nhật khi kết thúc round thông qua updateRoundLeaderboard
    // await updateMatchScoreOnChain(match_id, pointA, pointB);

    // 7. Cập nhật CSDL
    await match.update({
      winner_participant_id,
      point_team_a: pointA,
      point_team_b: pointB,
      score_team_a: score_team_a,
      score_team_b: score_team_b,
      status: 'COMPLETED'
    }, { transaction: t });

    // 8. Commit
    await t.commit();

    return res.json(responseSuccess({
      winner_participant_id,
      point_team_a: pointA,
      point_team_b: pointB,
      score_team_a,
      score_team_b
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

/**
 * Lấy danh sách trận đấu của team hiện tại (user đang đăng nhập)
 * GET /api/matches/my-team
 * Query params: 
 *   - page (default: 1)
 *   - limit (default: 10)
 *   - tournament_id (optional): lọc theo giải đấu
 *   - status (optional): PENDING, IN_PROGRESS, COMPLETED
 *   - search (optional): tìm kiếm theo tên đối thủ
 */
export const getMatchesByTeam = async (req, res) => {
  try {
    const { id: user_id } = req.user; // Lấy user_id từ token
    const { page, limit, tournament_id, status, search } = req.query;

    // 1. Tìm participant_id của user trong các tournament
    const participants = await models.Participant.findAll({
      where: { 
        user_id,
        status: 'APPROVED' // Chỉ lấy team đã được duyệt
      },
      attributes: ['id', 'tournament_id']
    });

    if (!participants || participants.length === 0) {
      return res.json(responseSuccess({
        matches: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      }, "Bạn chưa tham gia giải đấu nào"));
    }

    const participantIds = participants.map(p => p.id);

    // 2. Gọi service với danh sách participant_id
    const { matches, total } = await matchService.findMatchesByTeam(participantIds, {
      page: page || 1,
      limit: limit || 10,
      tournamentId: tournament_id,
      status,
      search
    });

    // 3. Format response - giữ nguyên structure từ DB, chỉ thêm avatar URL
    const formattedMatches = matches.map(match => ({
      id: match.id,
      tournament_id: match.tournament_id,
      round_number: match.round_number,
      team_a_participant_id: match.team_a_participant_id,
      team_b_participant_id: match.team_b_participant_id,
      winner_participant_id: match.winner_participant_id,
      point_team_a: match.point_team_a,
      point_team_b: match.point_team_b,
      score_team_a: match.score_team_a,
      score_team_b: match.score_team_b,
      status: match.status,
      match_time: match.match_time,
      created_at: match.created_at,
      updated_at: match.updated_at,
      tournament: match.tournament,
      teamA: match.teamA ? {
        id: match.teamA.id,
        user_id: match.teamA.user_id,
        team_name: match.teamA.team_name,
        wallet_address: match.teamA.wallet_address,
        avatar: match.teamA.team?.avatar ? `${backendUrl}${match.teamA.team.avatar}` : null
      } : null,
      teamB: match.teamB ? {
        id: match.teamB.id,
        user_id: match.teamB.user_id,
        team_name: match.teamB.team_name,
        wallet_address: match.teamB.wallet_address,
        avatar: match.teamB.team?.avatar ? `${backendUrl}${match.teamB.team.avatar}` : null
      } : null
    }));

    const currentPage = parseInt(page || 1);
    const currentLimit = parseInt(limit || 10);
    const totalPages = Math.ceil(total / currentLimit);

    return res.json(responseSuccess({
      matches: formattedMatches,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages
      }
    }, "Lấy danh sách trận đấu thành công"));

  } catch (error) {
    console.error("getMatchesByTeam error:", error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

/**
 * Lấy danh sách trận đấu của team cụ thể (public - không cần login)
 * GET /api/matches/team/:teamId
 * Query params: 
 *   - page (default: 1)
 *   - limit (default: 10)
 *   - status (optional): PENDING, IN_PROGRESS, COMPLETED
 */
export const getMatchesBySpecificTeam = async (req, res) => {
  try {
    const { teamId } = req.params; // Team ID từ URL
    const { page, limit, status } = req.query;

    // 1. Tìm participant_id của team trong các tournament
    const participants = await models.Participant.findAll({
      where: { 
        user_id: teamId,
        status: 'APPROVED'
      },
      attributes: ['id', 'tournament_id']
    });

    if (!participants || participants.length === 0) {
      return res.json(responseSuccess({
        matches: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      }, "Team chưa tham gia giải đấu nào"));
    }

    const participantIds = participants.map(p => p.id);

    // 2. Gọi service với danh sách participant_id
    const { matches, total } = await matchService.findMatchesByTeam(participantIds, {
      page: page || 1,
      limit: limit || 10,
      status
    });

    // 3. Format response
    const formattedMatches = matches.map(match => ({
      id: match.id,
      tournament_id: match.tournament_id,
      round_number: match.round_number,
      team_a_participant_id: match.team_a_participant_id,
      team_b_participant_id: match.team_b_participant_id,
      winner_participant_id: match.winner_participant_id,
      point_team_a: match.point_team_a,
      point_team_b: match.point_team_b,
      score_team_a: match.score_team_a,
      score_team_b: match.score_team_b,
      status: match.status,
      match_time: match.match_time,
      created_at: match.created_at,
      updated_at: match.updated_at,
      tournament: match.tournament,
      teamA: match.teamA ? {
        id: match.teamA.id,
        user_id: match.teamA.user_id,
        team_name: match.teamA.team_name,
        wallet_address: match.teamA.wallet_address,
        avatar: match.teamA.team?.avatar ? `${backendUrl}${match.teamA.team.avatar}` : null
      } : null,
      teamB: match.teamB ? {
        id: match.teamB.id,
        user_id: match.teamB.user_id,
        team_name: match.teamB.team_name,
        wallet_address: match.teamB.wallet_address,
        avatar: match.teamB.team?.avatar ? `${backendUrl}${match.teamB.team.avatar}` : null
      } : null
    }));

    const currentPage = parseInt(page || 1);
    const currentLimit = parseInt(limit || 10);
    const totalPages = Math.ceil(total / currentLimit);

    return res.json(responseSuccess({
      matches: formattedMatches,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages
      }
    }, "Lấy danh sách trận đấu thành công"));

  } catch (error) {
    console.error("getMatchesBySpecificTeam error:", error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

// === 7. Lấy trận đấu theo status (với query parameter) ===
export const getMatchesByStatus = async (req, res) => {
  try {
    const { status } = req.query; // live, upcoming, completed, done
    
    let matchStatus;
    let message;
    let filterByTime = false;
    
    switch(status?.toLowerCase()) {
      case 'live':
        // Live: trận đang diễn ra dựa trên thời gian (match_time <= hiện tại và chưa DONE)
        filterByTime = true;
        message = "Lấy danh sách trận đấu live thành công";
        break;
      case 'upcoming':
        matchStatus = 'PENDING'; // Sắp diễn ra
        message = "Lấy danh sách trận đấu sắp diễn ra thành công";
        break;
      case 'completed':
        matchStatus = 'COMPLETED'; // Có kết quả nhưng chưa kết thúc
        message = "Lấy danh sách trận đấu có kết quả thành công";
        break;
      case 'done':
        matchStatus = 'DONE'; // Đã kết thúc
        message = "Lấy danh sách trận đấu đã kết thúc thành công";
        break;
      default:
        // Nếu không có status, trả về tất cả
        const allMatches = await matchService.findAllMatchesWithDetails();
        return res.json(responseSuccess(allMatches, "Lấy tất cả trận đấu thành công"));
    }
    
    let matches;
    if (filterByTime) {
      // Lấy trận live dựa trên thời gian
      matches = await matchService.findLiveMatches();
    } else {
      matches = await matchService.findMatchesByStatus(matchStatus);
    }
    
    return res.json(responseSuccess(matches, message));
  } catch (error) {
    console.error("getMatchesByStatus error:", error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};