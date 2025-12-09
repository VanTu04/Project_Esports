// File: services/match.service.js
import models from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Lấy tất cả trận đấu (có lọc)
 */
export const findAll = async (query) => {
  const whereCondition = {};
  if (query.tournament_id) {
    whereCondition.tournament_id = query.tournament_id;
  }
  if (query.round_number) {
    whereCondition.round_number = query.round_number;
  }

  const matches = await models.Match.findAll({
    where: whereCondition,
    order: [['id', 'ASC']],
  });
  return matches;
};

/**
 * Tìm 1 trận đấu bằng ID
 */
export const findMatchById = async (match_id) => {
  const match = await models.Match.findByPk(match_id);
  return match;
};

/**
 * Cập nhật Lịch thi đấu
 */
export const scheduleTime = async (match, new_time) => {
  await match.update({
    match_time: new_time
  });
  return true;
};

/**
 * Cập nhật Kết quả (Điểm)
 */
export const updateResult = async (match, winner_id) => {
  await match.update({
    winner_participant_id: winner_id,
    status: 'COMPLETED'
  });
  return true;
};

/**
 * Lấy danh sách trận đấu của 1 team với phân trang và tìm kiếm
 * @param {number|number[]} participantIds - ID hoặc mảng IDs của participant
 */
export const findMatchesByTeam = async (participantIds, options = {}) => {
  const { 
    page = 1, 
    limit = 10, 
    tournamentId, 
    status,
    search 
  } = options;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Đảm bảo participantIds là array
  const ids = Array.isArray(participantIds) ? participantIds : [participantIds];

  // Build where clause
  const where = {
    [Op.or]: [
      { team_a_participant_id: { [Op.in]: ids } },
      { team_b_participant_id: { [Op.in]: ids } }
    ]
  };

  if (tournamentId) {
    where.tournament_id = tournamentId;
  }

  if (status) {
    where.status = status;
  }

  // Nếu có search, tìm kiếm theo tên đối thủ
  if (search) {
    // Tìm các participant có team_name chứa search keyword
    const participants = await models.Participant.findAll({
      where: {
        team_name: {
          [Op.like]: `%${search}%`
        }
      },
      attributes: ['id']
    });
    
    const searchParticipantIds = participants.map(p => p.id);
    
    if (searchParticipantIds.length > 0) {
      where[Op.and] = [
        {
          [Op.or]: [
            { team_a_participant_id: { [Op.in]: searchParticipantIds } },
            { team_b_participant_id: { [Op.in]: searchParticipantIds } }
          ]
        }
      ];
    } else {
      // Không tìm thấy đối thủ nào khớp
      return { matches: [], total: 0 };
    }
  }

  // Count total
  const total = await models.Match.count({ where });

  // Get matches with pagination
  const matches = await models.Match.findAll({
    where,
    include: [
      {
        model: models.Tournament,
        as: 'tournament',
        attributes: ['id', 'name', 'status']
      },
      {
        model: models.Participant,
        as: 'teamA',
        attributes: ['id', 'user_id', 'team_name', 'wallet_address'],
        include: [{
          model: models.User,
          as: 'team',
          attributes: ['id', 'username', 'avatar']
        }]
      },
      {
        model: models.Participant,
        as: 'teamB',
        attributes: ['id', 'user_id', 'team_name', 'wallet_address'],
        include: [{
          model: models.User,
          as: 'team',
          attributes: ['id', 'username', 'avatar']
        }]
      }
    ],
    order: [
      ['match_time', 'DESC'],      // Sắp xếp theo thời gian trận đấu (gần nhất trước)
      ['createdAt', 'DESC']        // Nếu không có match_time, xếp theo thời gian tạo
    ],
    limit: parseInt(limit),
    offset: offset
  });

  return { matches, total };
};

/**
 * Lấy danh sách trận đấu theo status với thông tin đầy đủ
 * @param {string} status - PENDING, IN_PROGRESS, COMPLETED
 */
export const findMatchesByStatus = async (status) => {
  const matches = await models.Match.findAll({
    where: { status },
    include: [
      {
        model: models.Tournament,
        as: 'tournament',
        attributes: ['id', 'name', 'status', 'game_id']
      },
      {
        model: models.Participant,
        as: 'teamA',
        attributes: ['id', 'user_id', 'team_name', 'wallet_address'],
        include: [{
          model: models.User,
          as: 'team',
          attributes: ['id', 'username', 'avatar']
        }]
      },
      {
        model: models.Participant,
        as: 'teamB',
        attributes: ['id', 'user_id', 'team_name', 'wallet_address'],
        include: [{
          model: models.User,
          as: 'team',
          attributes: ['id', 'username', 'avatar']
        }]
      }
    ],
    order: [
      ['match_time', 'ASC'],  // Sắp xếp theo thời gian trận đấu (sớm nhất trước)
      ['id', 'ASC']
    ]
  });

  // Return relative paths for avatars (frontend will build full URLs)
  return matches.map(match => ({
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
    created_at: match.createdAt,
    updated_at: match.updatedAt,
    tournament: match.tournament,
    team_a_name: match.teamA?.team_name || 'N/A',
    team_b_name: match.teamB?.team_name || 'BYE',
    team_a_avatar: match.teamA?.team?.avatar || null,
    team_b_avatar: match.teamB?.team?.avatar || null,
  }));
};