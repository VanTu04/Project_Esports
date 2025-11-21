import models from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Tạo record giải đấu mới
 */
export const create = async (data, options = {}) => {
  const newTournament = await models.Tournament.create({
    name: data.name,
    total_rounds: data.total_rounds,
    created_by: data.created_by || null,
    game_id: data.game_id || null,
    season_id: data.season_id || null,
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    description: data.description || null,
    registration_fee: data.registration_fee || null,
    status: 'PENDING',
    current_round: 0
  }, options);
  return newTournament;
};

/**
 * Tìm giải đấu theo tên
 */
export const getTournamentByName = async (name) => {
  const existing = await models.Tournament.findOne({
    where: { name: name }
  });
  return existing;
};

export const findParticipantsByStatus = async (id, status) => {
  const res = await models.Participant.findAll({
    where : {tournament_id: id, status: status}
  });
  return res;
}

/**
 * Tìm giải đấu theo ID (bao gồm các đội tham gia)
 */
export const findById = async (id) => {
  const tournament = await models.Tournament.findByPk(id);

  if (!tournament) return null;

  const participants = await models.Participant.findAll({
    where: {
      tournament_id: id
    },
    attributes: ['id', 'user_id', 'team_name', 'total_points', 'wallet_address', 'has_received_bye', 'status', 'createdAt', 'updatedAt', 'approved_at', 'approval_tx_hash', 'rejection_reason', 'registration_fee']
  });

  const result = tournament.get({ plain: true });
  result.participants = participants;

  return result;
};

/**
 * Lấy tất cả giải đấu (có lọc theo status)
 */
export const findAllByAdmin = async (status, page = 1, limit = 10) => {
  const whereCondition = {};
  if (status !== undefined && status !== null && status !== '') {
    whereCondition.status = status;
  }

  const offset = (page - 1) * limit;

  const { count, rows: tournaments } = await models.Tournament.findAndCountAll({
    where: whereCondition,
    order: [['createdAt', 'DESC']],
  attributes: ['id', 'name', 'status', 'total_rounds', 'current_round', 'start_date', 'end_date', 'start_time', 'end_time', 'registration_fee', 'isReady', 'createdAt', 'updatedAt'],
    include: [
      {
        model: models.TournamentReward,
        as: 'rewards',
        attributes: ['id', 'rank', 'reward_amount'],
        required: false // nếu giải đấu chưa có reward vẫn trả về
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  try {
    // Log a compact sample to help debug missing date fields (removed in production later)
    const sample = tournaments.slice(0, 5).map(t => (t && typeof t.get === 'function') ? t.get({ plain: true }) : t);
    console.log('[TournamentService.findAll] sample tournaments (id, start_date, end_date, start_time, end_time):',
      sample.map(s => ({ id: s.id, start_date: s.start_date, end_date: s.end_date, start_time: s.start_time, end_time: s.end_time })));
  } catch (e) {
    console.warn('Could not log tournaments sample', e);
  }

  return {
    tournaments,
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page)
  };
};

export const findAll = async (status, page = 1, limit = 10) => {
  const whereCondition = {};
  if (status !== undefined && status !== null && status !== '') {
    whereCondition.status = status;
  }

  whereCondition.isReady = 1;

  const offset = (page - 1) * limit;

  const { count, rows: tournaments } = await models.Tournament.findAndCountAll({
    where: whereCondition,
    order: [['createdAt', 'DESC']],
  attributes: ['id', 'name', 'status', 'total_rounds', 'current_round', 'start_date', 'end_date', 'start_time', 'end_time', 'registration_fee', 'createdAt', 'updatedAt'],
    include: [
      {
        model: models.TournamentReward,
        as: 'rewards',
        attributes: ['id', 'rank', 'reward_amount'],
        required: false // nếu giải đấu chưa có reward vẫn trả về
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  try {
    // Log a compact sample to help debug missing date fields (removed in production later)
    const sample = tournaments.slice(0, 5).map(t => (t && typeof t.get === 'function') ? t.get({ plain: true }) : t);
    console.log('[TournamentService.findAll] sample tournaments (id, start_date, end_date, start_time, end_time):',
      sample.map(s => ({ id: s.id, start_date: s.start_date, end_date: s.end_date, start_time: s.start_time, end_time: s.end_time })));
  } catch (e) {
    console.warn('Could not log tournaments sample', e);
  }

  return {
    tournaments,
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page)
  };
};

export const getUserByWallet = async (walletAddress) => {
  return await models.User.findOne({
    where: {
      wallet_address: walletAddress
    },
    attributes: ['id', 'username', 'email', 'wallet_address']
  });
};

/**
 * Tìm User (Đội) theo ID
 */
export const findUserById = async (user_id) => {
  return await models.User.findByPk(user_id);
};

/**
 * Cập nhật thông tin giải đấu
 */
export const update = async (tournament, data) => {
  await tournament.update({
    name: data.name || tournament.name,
    total_rounds: data.total_rounds || tournament.total_rounds,
    status: data.status || tournament.status
  });
  return true;
};

/**
 * Xóa giải đấu
 */
export const deleteTournament = async (tournament_id) => {
  const tournament = await models.Tournament.findByPk(tournament_id);
  if (tournament) {
    await tournament.destroy();
    return true;
  }
  return false;
};

// ============================
// === CÁC HÀM NGHIỆP VỤ MỚI ===
// ============================

/**
 * Tạo participant khi team request join
 */
export const createParticipant = async (data) => {
  return await models.Participant.create(data);
};

/**
 * Tìm xem đội đã đăng ký giải này chưa
 */
export const findParticipantByUser = async (tournament_id, user_id) => {
  return await models.Participant.findOne({
    where: { tournament_id, user_id }
  });
};

/**
 * Tìm participant theo ID
 */
export const findParticipantById = async (participant_id) => {
  return await models.Participant.findByPk(participant_id);
};

/**
 * Cập nhật status của toàn bộ participant trong 1 giải
 */
export const updateParticipantStatusByTournament = async (
  tournament_id,
  old_status,
  new_status
) => {
  const [affectedRows] = await models.Participant.update(
    { status: new_status },
    {
      where: {
        tournament_id: tournament_id,
        status: old_status
      }
    }
  );
  return affectedRows;
};

/**
 * Lấy danh sách participant của 1 giải theo status
 */
export const getParticipantsByStatus = async (tournament_id, status) => {
  return await models.Participant.findAll({
    where: {
      tournament_id: tournament_id,
      status: status
    }
  });
};

/**
 * Tạo hàng loạt các trận đấu (Matches)
 */
export const createMatches = async (matchesData) => {
  return await models.Match.bulkCreate(matchesData);
};

/**
 * Cập nhật trạng thái và vòng đấu của giải
 */
export const updateTournamentStatus = async (
  tournament,
  new_status,
  new_round
) => {
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
};

export const markParticipantBye = async (participantId) => {
  const participant = await models.Participant.findByPk(participantId);
  if (!participant) throw new Error(`Participant ${participantId} not found`);

  participant.has_received_bye = true;
  await participant.save();

  return participant;
};


export const findParticipantsByIds = async (participant_ids) => {
  return await models.Participant.findAll({
    where: {
      id: {
        [Op.in]: participant_ids
      }
    },
    attributes: ['id', 'team_name', 'user_id']
  });
};

export const findParticipantsByRound = async (tournament_id, round_number) => {
  return await models.Participant.findAll({
    where: { tournament_id, round_number },
    raw: true
  });
};
