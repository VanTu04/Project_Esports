import models from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Tạo record giải đấu mới
 */
export const create = async (data) => {
  const newTournament = await models.Tournament.create({
    name: data.name,
    total_rounds: data.total_rounds,
    created_by: data.created_by || null,
    status: 'PENDING', // Đảm bảo dùng 'PENDING'
    current_round: 0
  });
  return newTournament;
};

/**
 * Tìm giải đấu theo tên
 */
export const getTournamentByName = async (name) => {
  const existing = await models.Tournament.findOne({ where: { name: name } });
  return existing;
};

/**
 * Tìm giải đấu theo ID (bao gồm các đội tham gia)
 * Sửa lại: Lấy *tất cả* participant, không chỉ 'approved'
 */
export const findById = async (id) => {
  const tournament = await models.Tournament.findByPk(id);

  if (!tournament) {
    return null; // Không tìm thấy giải đấu
  }

  const participants = await models.Participant.findAll({
    where: {
      tournament_id: id
    },
    attributes: ['id', 'user_id', 'team_name', 'wallet_address', 'has_received_bye', 'status']
  });

  const result = tournament.get({ plain: true });
  result.participants = participants;

  return result;
};

/**
 * Lấy tất cả giải đấu (có lọc theo status)
 */
export const findAll = async (status) => {
  const whereCondition = {};
  if (status !== undefined && status !== null && status !== '') {
    whereCondition.status = status;
  }

  const tournaments = await models.Tournament.findAll({
    where: whereCondition,
    order: [['createdAt', 'DESC']],
    attributes: ['id', 'name', 'status', 'total_rounds', 'current_round']
  });
  return tournaments;
};

/**
 * (Helper) Tìm User (Đội) theo ID
 */
export const findUserById = async (user_id) => {
  const team = await models.User.findByPk(user_id);
  return team;
};

/**
 * Cập nhật thông tin giải đấu
 */
export const update = async (tournament, data) => {
  await tournament.update({
    name: data.name || tournament.name,
    total_rounds: data.total_rounds || tournament.total_rounds,
    status: data.status || tournament.status,
  });
  return true;
};

export const deleteTournament = async (tournament_id) => {
  // 1. Phải tìm lại (find) instance trước khi destroy
  const tournament = await models.Tournament.findByPk(tournament_id);

  if (tournament) {
    await tournament.destroy();
    return true;
  }

  return false; 
};


// ========================================================
// === CÁC HÀM MỚI VÀ ĐÃ SỬA TÊN CHO LUỒNG NGHIỆP VỤ MỚI ===
// ========================================================

/**
 * (ĐÃ ĐỔI TÊN)
 * Tạo record Participant (khi team request join)
 * @param {object} data - Dữ liệu của Participant
 */
export const createParticipant = async (data) => {
  const newParticipant = await models.Participant.create(data);
  return newParticipant;
};

/**
 * (ĐÃ ĐỔI TÊN)
 * Tìm xem đội đã đăng ký giải này chưa
 * @param {number} tournament_id
 * @param {number} user_id
 */
export const findParticipantByUser = async (tournament_id, user_id) => {
  const existing = await models.Participant.findOne({
    where: { tournament_id, user_id }
  });
  return existing;
};

/**
 * (HÀM MỚI)
 * Tìm một participant theo ID (Primary Key) của chính nó
 * @param {number} participant_id
 */
export const findParticipantById = async (participant_id) => {
  const participant = await models.Participant.findByPk(participant_id);
  return participant;
};

/**
 * (HÀM MỚI)
 * Cập nhật status của TẤT CẢ participant trong 1 giải đấu
 * @param {number} tournament_id
 * @param {string} old_status - Trạng thái cũ (ví dụ 'PENDING')
 * @param {string} new_status - Trạng thái mới (ví dụ 'REJECTED')
 */
export const updateParticipantStatusByTournament = async (tournament_id, old_status, new_status) => {
  const [affectedRows] = await models.Participant.update(
    { status: new_status },
    {
      where: {
        tournament_id: tournament_id,
        status: old_status
      }
    }
  );
  return affectedRows; // Trả về số lượng dòng đã bị ảnh hưởng
};

/**
 * (HÀM MỚI)
 * Lấy danh sách participant của 1 giải theo status
 * @param {number} tournament_id
 * @param {string} status - (ví dụ 'APPROVED')
 */
export const getParticipantsByStatus = async (tournament_id, status) => {
  const participants = await models.Participant.findAll({
    where: {
      tournament_id: tournament_id,
      status: status
    }
  });
  return participants;
};

/**
 * (HÀM MỚI)
 * Tạo hàng loạt các trận đấu (Matches)
 * @param {Array<object>} matchesData - Mảng các đối tượng trận đấu
 */
export const createMatches = async (matchesData) => {
  const newMatches = await models.Match.bulkCreate(matchesData);
  return newMatches;
};

/**
 * (HÀM MỚI)
 * Cập nhật trạng thái và vòng đấu của giải
 * @param {object} tournament - Instance Sequelize của giải đấu
 * @param {string} new_status - Trạng thái mới (ví dụ 'ACTIVE')
 * @param {number} new_round - Vòng đấu mới (ví dụ 1)
 */
export const updateTournamentStatus = async (tournament, new_status, new_round) => {
  await tournament.update({
    status: new_status,
    current_round: new_round
  });
  return true;
};

/**
 * Lấy danh sách trận đấu của tournament
 */
export const getTournamentMatches = async (tournament_id, round = null) => {
  const whereCondition = { tournament_id };
  
  if (round !== null && round !== undefined) {
    whereCondition.round_number = parseInt(round);
  }
  
  const matches = await models.Match.findAll({
    where: whereCondition,
    include: [
      {
        model: models.Participant,
        as: 'teamA',
        attributes: ['id', 'team_name', 'wallet_address']
      },
      {
        model: models.Participant,
        as: 'teamB',
        attributes: ['id', 'team_name', 'wallet_address']
      },
      {
        model: models.Participant,
        as: 'winner',
        attributes: ['id', 'team_name']
      }
    ],
    order: [
      ['round_number', 'ASC'],
      ['id', 'ASC']
    ]
  });
  
  return matches;


//
export const findParticipantsByIds = async (participant_ids) => {
  const participants = await models.Participant.findAll({
    where: {
      id: {
        [Op.in]: participant_ids // Dùng Op.in để tìm tất cả ID trong mảng
      }
    },
    attributes: ['id', 'team_name'] // Chỉ cần lấy ID và Tên
  });
  return participants;
};

export const findParticipantsByRound = async (tournament_id, round_number) => {
  return await models.Participant.findAll({
    where: { tournament_id, round_number },
    raw: true
  });
};