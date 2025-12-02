import models from '../models/index.js';

export const linkWallet = async (id, wallet_address) => {
  try {
    await models.Team.update(
      { wallet_address },
      { where: { id } }
    );
    return true;
  } catch (error) {
    throw new Error(`linkWallet error: ${error.message}`);
  }
};

export const getTeamById = async (id) => {
  try {
    const team = await models.Team.findByPk(id);
    if (!team) {
      throw new Error('Không tìm thấy đội tuyển');
    }
    return team;
  } catch (error) {
    throw new Error(`getTeamById error: ${error.message}`);
  }
};

export const getAllTeams = async (params = {}) => {
  try {
    const where = {
      role: 3, // TEAM_MANAGER role
      status: 1,
      deleted: 0
    };

    // Filter by search query (tìm theo username hoặc full_name)
    if (params.search) {
      where[models.Sequelize.Op.or] = [
        { username: { [models.Sequelize.Op.like]: `%${params.search}%` } },
        { full_name: { [models.Sequelize.Op.like]: `%${params.search}%` } }
      ];
    }

    const teams = await models.User.findAll({
      where,
      attributes: ['id', 'username', 'full_name', 'email', 'avatar', 'phone', 'wallet_address', 'created_date'],
      order: [['created_date', 'DESC']]
    });

    return { teams };
  } catch (error) {
    throw new Error(`getAllTeams error: ${error.message}`);
  }
};

export const getTopTeamsByWins = async (limit = 5) => {
  try {
    // Lấy tất cả matches đã hoàn thành có winner
    const matches = await models.Match.findAll({
      where: {
        status: 'DONE',
        winner_participant_id: { [models.Sequelize.Op.ne]: null }
      },
      include: [
        {
          model: models.Participant,
          as: 'winner',
          where: { status: 'APPROVED' },
          include: [{
            model: models.User,
            as: 'team',
            attributes: ['id', 'username', 'full_name', 'avatar']
          }]
        }
      ],
      attributes: ['id', 'winner_participant_id']
    });

    // Đếm số trận thắng cho mỗi user_id
    const winsMap = {};
    const teamInfoMap = {};

    matches.forEach(match => {
      const winner = match.winner;
      if (!winner) return;

      const userId = winner.user_id;
      
      if (!winsMap[userId]) {
        winsMap[userId] = 0;
        teamInfoMap[userId] = {
          user_id: userId,
          team_name: winner.team_name,
          total_points: winner.total_points,
          avatar: winner.team?.avatar,
          full_name: winner.team?.full_name
        };
      }
      winsMap[userId]++;
    });

    // Chuyển thành array và sort
    const teamsArray = Object.keys(winsMap).map(userId => ({
      ...teamInfoMap[userId],
      wins: winsMap[userId]
    })).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return (b.total_points || 0) - (a.total_points || 0);
    }).slice(0, parseInt(limit));

    // Đếm số trận thua cho mỗi đội
    const teamsWithStats = await Promise.all(teamsArray.map(async (team) => {
      // Lấy tất cả participant của user này
      const participants = await models.Participant.findAll({
        where: { user_id: team.user_id },
        attributes: ['id']
      });

      const participantIds = participants.map(p => p.id);

      if (participantIds.length === 0) {
        return {
          id: team.user_id,
          name: team.team_name || team.full_name,
          team_name: team.team_name,
          logo: team.avatar,
          avatar: team.avatar,
          wins: team.wins,
          losses: 0,
          points: parseInt(team.total_points) || 0,
          total_points: parseInt(team.total_points) || 0
        };
      }

      // Đếm số trận thua
      const lossCount = await models.Match.count({
        where: {
          status: 'DONE',
          winner_participant_id: { [models.Sequelize.Op.ne]: null },
          [models.Sequelize.Op.or]: [
            { 
              team_a_participant_id: { [models.Sequelize.Op.in]: participantIds },
              winner_participant_id: { [models.Sequelize.Op.notIn]: participantIds }
            },
            { 
              team_b_participant_id: { [models.Sequelize.Op.in]: participantIds },
              winner_participant_id: { [models.Sequelize.Op.notIn]: participantIds }
            }
          ]
        }
      });

      return {
        id: team.user_id,
        name: team.team_name || team.full_name,
        team_name: team.team_name,
        logo: team.avatar,
        avatar: team.avatar,
        wins: team.wins,
        losses: lossCount || 0,
        points: parseInt(team.total_points) || 0,
        total_points: parseInt(team.total_points) || 0
      };
    }));

    return teamsWithStats;
  } catch (error) {
    console.error('getTopTeamsByWins error:', error);
    throw new Error(`getTopTeamsByWins error: ${error.message}`);
  }
};

