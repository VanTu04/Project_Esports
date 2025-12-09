import models from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Tạo record giải đấu mới
 */
export const create = async (data, options = {}) => {
  const newTournament = await models.Tournament.create({
    name: data.name,
    total_rounds: data.total_rounds,
    total_team: data.total_team,
    created_by: data.created_by || null,
    game_id: data.game_id || null,
    season_id: data.season_id || null,
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    description: data.description || null,
    registration_fee: data.registration_fee || null,
    image: data.image || null,
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

const backendUrl = (process.env.BACKEND_URL || 'https://api.vawndev.online').replace(/\/$/, '');

const normalizeImageUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (/^data:/i.test(url)) return url;
  if (url.startsWith('/')) return `${backendUrl}${url}`;
  return `${backendUrl}/${url}`;
};

export const findParticipantsByStatus = async (id, status) => {
  const res = await models.Participant.findAll({
    where : {tournament_id: id, status: status},
    include: [
      {
        model: models.User,
        as: 'team',
        attributes: ['id', 'avatar', 'full_name', 'username']
      }
    ]
  });

  // normalize to plain objects and expose avatar/logo_url for frontend
  return res.map(r => {
    const p = (typeof r.get === 'function') ? r.get({ plain: true }) : (typeof r.toJSON === 'function' ? r.toJSON() : r);
    const rawAvatar = p.team?.avatar || null;
    p.avatar = rawAvatar;
    p.logo_url = normalizeImageUrl(rawAvatar);
    return p;
  });
}

/**
 * Tìm giải đấu theo ID (bao gồm các đội tham gia)
 */
export const findById = async (id) => {
  const tournament = await models.Tournament.findOne({
    where: { id, deleted: 0 },
    include: [
      {
        model: models.Game,
        as: 'game',
        attributes: ['id', 'game_name', 'status'],
        required: false
      },
      {
        model: models.TournamentReward,
        as: 'rewards',
        attributes: ['id', 'rank', 'reward_amount'],
        required: false
      }
    ]
  });

  if (!tournament) return null;

  const participantsRaw = await models.Participant.findAll({
    where: {
      tournament_id: id
    },
    attributes: ['id', 'user_id', 'team_name', 'total_points', 'wallet_address', 'has_received_bye', 'status', 'createdAt', 'updatedAt', 'approved_at', 'approval_tx_hash', 'rejection_reason', 'registration_fee'],
    include: [
      {
        model: models.User,
        as: 'team',
        attributes: ['id', 'avatar', 'full_name', 'username']
      }
    ]
  });

  const participants = participantsRaw.map(p => {
    const item = (typeof p.get === 'function') ? p.get({ plain: true }) : (typeof p.toJSON === 'function' ? p.toJSON() : p);
    const rawAvatar = item.team?.avatar || null;
    item.avatar = rawAvatar;
    item.logo_url = normalizeImageUrl(rawAvatar);
    return item;
  });

  const result = tournament.get({ plain: true });
  result.participants = participants;
  
  // Tính total_prize từ rewards
  let totalPrize = 0;
  if (result.rewards && Array.isArray(result.rewards)) {
    totalPrize = result.rewards.reduce((sum, reward) => {
      return sum + (parseFloat(reward.reward_amount) || 0);
    }, 0);
  }
  result.total_prize = totalPrize;
  
  // Đếm số đội đã được duyệt
  result.approved_participants = participants.filter(p => p.status === 'APPROVED').length;

  return result;
};

/**
 * Lấy tất cả giải đấu (có lọc theo status)
 */
export const findAllByAdmin = async (status, page = 1, limit = 10, filters = {}) => {
  const whereCondition = {
    deleted: 0  // Exclude deleted tournaments
  };
  if (status !== undefined && status !== null && status !== '') {
    whereCondition.status = status;
  }

  // Support isReady filter (0 = not open, 1 = ready/open)
  if (filters.isReady !== undefined && filters.isReady !== null && filters.isReady !== '') {
    whereCondition.isReady = parseInt(filters.isReady);
  }

  // Support search filter
  if (filters.search) {
    whereCondition.name = { [Op.like]: `%${filters.search}%` };
  }

  const offset = (page - 1) * limit;

  // Base query options
  const queryOptions = {
    where: whereCondition,
    order: [['createdAt', 'DESC']],
    attributes: ['id', 'name', 'status', 'total_rounds', 'total_team', 'current_round', 'start_date', 'isReady', 'leaderboard_saved', 'reward_distributed', 'end_date', 'start_time', 'end_time', 'registration_fee', 'game_id', 'image', 'createdAt', 'updatedAt'],
    distinct: true,
    include: [
      {
        model: models.Game,
        as: 'game',
        attributes: ['id', 'game_name', 'status'],
        required: false
      },
      {
        model: models.TournamentReward,
        as: 'rewards',
        attributes: ['id', 'rank', 'reward_amount', 'hash', 'distributed_at', 'blockNumber'],
        required: false
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset)
  };

  // Support hasRegistrations filter (tournaments with at least 1 participant waiting approval or approved)
  if (filters.hasRegistrations === '1' || filters.hasRegistrations === 1) {
    queryOptions.include.push({
      model: models.Participant,
      as: 'participants',
      where: { status:'WAITING_APPROVAL' },
      attributes: [],
      required: true // INNER JOIN to only get tournaments with participants
    });
  }

  const { count, rows: tournaments } = await models.Tournament.findAndCountAll(queryOptions);

  return {
    tournaments,
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page)
  };
};

export const findAll = async (status, page = 1, limit = 10, filters = {}) => {
  const whereCondition = {
    deleted: 0,  // Exclude deleted tournaments
    isReady: 1
  };
  if (status !== undefined && status !== null && status !== '') {
    whereCondition.status = status;
  }

  // Add search filter for tournament name
  if (filters.search) {
    whereCondition.name = {
      [models.Sequelize.Op.like]: `%${filters.search}%`
    };
  }

  // Add game_id filter
  if (filters.game_id) {
    whereCondition.game_id = filters.game_id;
  }

  const offset = (page - 1) * limit;

  // Base query options
  const queryOptions = {
    where: whereCondition,
    order: [['createdAt', 'DESC']],
    attributes: ['id', 'name', 'status', 'total_rounds', 'total_team', 'current_round', 'start_date', 'isReady', 'leaderboard_saved', 'reward_distributed', 'end_date', 'start_time', 'end_time', 'registration_fee', 'game_id', 'image', 'createdAt', 'updatedAt'],
    distinct: true,  // Count only unique tournaments (avoid duplicates from joins)
    include: [
      {
        model: models.Game,
        as: 'game',
        attributes: ['id', 'game_name', 'status'],
        required: false
      },
      {
        model: models.TournamentReward,
        as: 'rewards',
        attributes: ['id', 'rank', 'reward_amount', 'hash', 'distributed_at', 'blockNumber'],
        required: false // nếu giải đấu chưa có reward vẫn trả về
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset)
  };

  // Support hasMatches filter: only return tournaments which have at least 1 match
  if (filters && (filters.hasMatches === '1' || filters.hasMatches === 1 || filters.hasMatches === true)) {
    queryOptions.include.push({
      model: models.Match,
      as: 'matches',
      attributes: [],
      required: true // INNER JOIN to only get tournaments with matches
    });
  }

  const { count, rows: tournaments } = await models.Tournament.findAndCountAll(queryOptions);

  // Tính total_prize và approved_participants cho mỗi tournament
  const tournamentsWithPrize = await Promise.all(tournaments.map(async (tournament) => {
    const tournamentData = tournament.get({ plain: true });
    
    // Tính tổng giải thưởng từ rewards
    let totalPrize = 0;
    if (tournamentData.rewards && Array.isArray(tournamentData.rewards)) {
      totalPrize = tournamentData.rewards.reduce((sum, reward) => {
        return sum + (parseFloat(reward.reward_amount) || 0);
      }, 0);
    }
    
    // Đếm số đội đã được duyệt (APPROVED)
    const approvedCount = await models.Participant.count({
      where: {
        tournament_id: tournamentData.id,
        status: 'APPROVED'
      }
    });
    
    return {
      ...tournamentData,
      total_prize: totalPrize,
      approved_participants: approvedCount
    };
  }));

  try {
    // Log a compact sample to help debug missing date fields (removed in production later)
    const sample = tournamentsWithPrize.slice(0, 5).map(t => ({ id: t.id, start_date: t.start_date, end_date: t.end_date, start_time: t.start_time, end_time: t.end_time, total_prize: t.total_prize }));
    console.log('[TournamentService.findAll] sample tournaments (id, start_date, end_date, start_time, end_time, total_prize):',
      sample);
  } catch (e) {
    console.warn('Could not log tournaments sample', e);
  }

  return {
    tournaments: tournamentsWithPrize,
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
    attributes: ['id', 'username', 'email', 'wallet_address', 'avatar']
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
  const res = await models.Participant.findAll({
    where: {
      tournament_id: tournament_id,
      status: status
    },
    include: [
      {
        model: models.User,
        as: 'team',
        attributes: ['id', 'avatar', 'full_name', 'username']
      }
    ]
  });

  return res.map(r => {
    const p = (typeof r.get === 'function') ? r.get({ plain: true }) : (typeof r.toJSON === 'function' ? r.toJSON() : r);
    const rawAvatar = p.team?.avatar || null;
    p.avatar = rawAvatar;
    p.logo_url = normalizeImageUrl(rawAvatar);
    return p;
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
        attributes: ['id', 'team_name', 'wallet_address'],
        include: [ { model: models.User, as: 'team', attributes: ['id', 'avatar', 'full_name'] } ]
      },
      {
        model: models.Participant,
        as: 'teamB',
        attributes: ['id', 'team_name', 'wallet_address'],
        include: [ { model: models.User, as: 'team', attributes: ['id', 'avatar', 'full_name'] } ]
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
