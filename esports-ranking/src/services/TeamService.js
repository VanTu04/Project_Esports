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
    // Lấy thông tin user với role TEAM_MANAGER
    const user = await models.User.findOne({
      where: { 
        id: id,
        role: 3, // TEAM_MANAGER
        status: 1,
        deleted: 0
      },
      attributes: ['id', 'username', 'full_name', 'email', 'avatar', 'phone', 'wallet_address', 'created_date', 'description']
    });

    if (!user) {
      throw new Error('Không tìm thấy đội tuyển');
    }

    // Lấy tất cả participant của user này để tính stats
    const participants = await models.Participant.findAll({
      where: { user_id: id, status: 'APPROVED' },
      attributes: ['id', 'team_name', 'total_points']
    });

    const participantIds = participants.map(p => p.id);
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let teamName = participants[0]?.team_name || user.full_name;

    if (participantIds.length > 0) {
      // Đếm số trận thắng
      wins = await models.Match.count({
        where: {
          status: 'DONE',
          winner_participant_id: { [models.Sequelize.Op.in]: participantIds }
        }
      });

      // Đếm số trận thua
      losses = await models.Match.count({
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

      // Đếm số trận hòa (nếu có)
      draws = await models.Match.count({
        where: {
          status: 'DONE',
          winner_participant_id: null,
          [models.Sequelize.Op.or]: [
            { team_a_participant_id: { [models.Sequelize.Op.in]: participantIds } },
            { team_b_participant_id: { [models.Sequelize.Op.in]: participantIds } }
          ]
        }
      });
    }

    // Đếm followers/following dựa trên bảng FavoriteTeam
    const followersCount = await models.FavoriteTeam.count({ where: { team_id: id } });
    const followingCount = await models.FavoriteTeam.count({ where: { user_id: id } });

    // Lấy danh sách thành viên
    const members = await models.TeamMember.findAll({
      where: {
        team_id: id,
        status: 'APPROVED'
      }
    });

    const formattedMembers = members.map(m => ({
      id: m.id,
      name: m.full_name || '',
      full_name: m.full_name || null,
      avatar: null,
      phone: m.phone || null,
      email: m.email || null,
      position: m.position || null,
      in_game_name: m.in_game_name || null,
      role: 'Player',
      status: m.status
    }));

    // Lấy danh sách giải đấu đã tham gia
    const tournaments = await models.Tournament.findAll({
      include: [{
        model: models.Participant,
        as: 'participants',
        where: { 
          user_id: id,
          status: 'APPROVED'
        },
        required: true,
        attributes: ['id', 'team_name', 'total_points']
      }],
      attributes: ['id', 'name', 'start_date', 'end_date', 'status', 'image']
    });

    // Lấy danh sách trận đấu
    const matches = await models.Match.findAll({
      where: {
        [models.Sequelize.Op.or]: [
          { team_a_participant_id: { [models.Sequelize.Op.in]: participantIds } },
          { team_b_participant_id: { [models.Sequelize.Op.in]: participantIds } }
        ]
      },
      attributes: ['id', 'match_time', 'status', 'team_a_participant_id', 'team_b_participant_id', 'winner_participant_id'],
      order: [['match_time', 'DESC']],
      limit: 20
    });

    // Lấy tên đội cho từng trận đấu
    const formattedMatches = await Promise.all(matches.map(async (match) => {
      const teamA = await models.Participant.findByPk(match.team_a_participant_id, { attributes: ['team_name'] });
      const teamB = await models.Participant.findByPk(match.team_b_participant_id, { attributes: ['team_name'] });
      
      return {
        id: match.id,
        match_time: match.match_time,
        status: match.status,
        team_a_name: teamA?.team_name || 'TBD',
        team_b_name: teamB?.team_name || 'TBD',
        winner_participant_id: match.winner_participant_id
      };
    }));

    return {
      id: user.id,
      name: user.full_name,
      team_name: teamName,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone,
      wallet_address: user.wallet_address,
      created_at: user.created_date,
      wins: wins,
      losses: losses,
      draws: draws,
      total_matches: wins + losses + draws,
      followers: followersCount,
      following: followingCount,
      description: user.description || `Đội ${teamName}`,
      members: formattedMembers,
      tournaments: tournaments || [],
      matches: formattedMatches || []
    };
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

export const getMyTeamInfo = async (userId) => {
  try {
    // Lấy thông tin user với role TEAM_MANAGER
    const user = await models.User.findOne({
      where: { 
        id: userId,
        role: 3, // TEAM_MANAGER
        status: 1,
        deleted: 0
      },
      // Note: do not request non-existing 'following' column — use FavoriteTeam table instead
      attributes: ['id', 'username', 'full_name', 'email', 'avatar', 'phone', 'wallet_address', 'created_date', 'description']
    });

    if (!user) {
      throw new Error('Không tìm thấy thông tin đội');
    }

    console.log(`[TeamService] getMyTeamInfo - user.avatar raw value:`, user.avatar);

    // Lấy tất cả participant của user này để tính stats
    const participants = await models.Participant.findAll({
      where: { user_id: userId, status: 'APPROVED' },
      attributes: ['id', 'team_name', 'total_points']
    });

    const participantIds = participants.map(p => p.id);
    let wins = 0;
    let losses = 0;
    let teamName = participants[0]?.team_name || user.full_name;

    if (participantIds.length > 0) {
      // Đếm số trận thắng
      wins = await models.Match.count({
        where: {
          status: 'DONE',
          winner_participant_id: { [models.Sequelize.Op.in]: participantIds }
        }
      });

      // Đếm số trận thua
      losses = await models.Match.count({
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
    }

    // Đếm followers/following dựa trên bảng FavoriteTeam
    const followersCount = await models.FavoriteTeam.count({ where: { team_id: userId } });
    const followingCount = await models.FavoriteTeam.count({ where: { user_id: userId } });
    console.log(`[TeamService] getMyTeamInfo - followersCount: ${followersCount}, followingCount: ${followingCount}`);

    // Lấy danh sách giải đấu đã tham gia
    // Use the correct association alias 'participants' defined in Tournament.associate
    const tournaments = await models.Tournament.findAll({
      include: [{
        model: models.Participant,
        as: 'participants',
        where: { 
          user_id: userId,
          status: 'APPROVED'
        },
        required: true,
        attributes: ['id', 'team_name', 'total_points']
      }],
      // Only select existing tournament attributes
      attributes: ['id', 'name', 'start_date', 'end_date', 'status', 'image']
    });

    // Log participant avatar/raw info for debugging
    try {
      console.log(`[TeamService] getMyTeamInfo - tournaments found: ${tournaments.length}`);
      tournaments.forEach(t => {
        const p = (t.participants || [])[0];
        console.log(`[TeamService] tournament ${t.id} participants length:`, (t.participants || []).length);
        if (p && p.team && p.team.avatar) {
          console.log(`[TeamService] tournament ${t.id} participant team.avatar:`, p.team.avatar);
        }
      });
    } catch (e) {
      // ignore logging errors
    }

    return {
      id: user.id,
      name: user.full_name,
      team_name: teamName,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone,
      wallet_address: user.wallet_address,
      created_date: user.created_date,
      wins: wins,
      losses: losses,
      total_matches: wins + losses,
      followers: followersCount,
      following: followingCount,
      description: user.description || `Đội ${teamName}`,
      tournaments: tournaments || []
    };
  } catch (error) {
    throw new Error(`getMyTeamInfo error: ${error.message}`);
  }
};

export const getMyTeamMembers = async (userId) => {
  try {
    // Lấy danh sách thành viên của team (giả sử team_id = userId của TEAM_MANAGER)
    const members = await models.TeamMember.findAll({
      where: {
        team_id: userId,
        status: 'APPROVED'
      }
    });

    // Trả về các trường đã lưu trong TeamMember — không có liên kết user
    return members.map(m => ({
      id: m.id,
      // user_id field removed from model; keep null for compatibility
      user_id: null,
      name: m.full_name || '',
      full_name: m.full_name || null,
      username: null,
      avatar: null,
      phone: m.phone || null,
      email: m.email || null,
      position: m.position || null,
      in_game_name: m.in_game_name || null,
      role: 'Player',
      status: m.status
    }));
  } catch (error) {
    throw new Error(`getMyTeamMembers error: ${error.message}`);
  }
};
export const addTeamMember = async (teamUserId, memberData) => {
  try {
    console.log('[TeamService] addTeamMember called for teamUserId:', teamUserId, 'memberData:', memberData);
    const { full_name, phone, email, position, in_game_name } = memberData;

    // Kiểm tra trùng lặp theo phone/email trong cùng 1 team
    if (phone || email) {
      const existing = await models.TeamMember.findOne({
        where: {
          team_id: teamUserId,
          [models.Sequelize.Op.or]: [
            phone ? { phone } : null,
            email ? { email } : null
          ].filter(Boolean)
        }
      });

      console.log('[TeamService] duplicate check result:', !!existing);

      if (existing) {
        throw new Error('Đã tồn tại thành viên với phone/email này trong đội');
      }
    }

    // Tạo thành viên mới
    console.log('[TeamService] creating TeamMember with', { team_id: teamUserId, full_name, phone, email, position, in_game_name });
    const newMember = await models.TeamMember.create({
      team_id: teamUserId,
      full_name: full_name || null,
      phone: phone || null,
      email: email || null,
      position: position || null,
      in_game_name: in_game_name || null,
      status: 'APPROVED'
    });

    console.log('[TeamService] TeamMember created id:', newMember.id);

    return {
      id: newMember.id,
      user_id: null,      // Không còn user_id
      name: newMember.full_name || null,
      full_name: newMember.full_name || null,
      username: null,
      avatar: null,
      phone: newMember.phone || null,
      email: newMember.email || null,
      position: newMember.position || null,
      in_game_name: newMember.in_game_name || null,
      role: 'Player',
      status: newMember.status
    };
  } catch (error) {
    console.error('[TeamService] addTeamMember error:', error);
    throw new Error(`addTeamMember error: ${error.message}`);
  }
};

export const removeTeamMember = async (teamUserId, memberId) => {
  try {
    const deleted = await models.TeamMember.destroy({
      where: {
        id: memberId,
        team_id: teamUserId
      }
    });

    if (!deleted) {
      throw new Error('Không tìm thấy thành viên');
    }

    return true;
  } catch (error) {
    throw new Error(`removeTeamMember error: ${error.message}`);
  }
};

export const updateMyTeamInfo = async (userId, data = {}) => {
  try {
    // Only allow a small set of editable fields from team managers
    const allowed = ['full_name', 'phone', 'description', 'avatar', 'cover_image'];
    const payload = {};
    allowed.forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(data, k)) payload[k] = data[k];
    });

    if (Object.keys(payload).length === 0) {
      throw new Error('Không có trường nào để cập nhật');
    }

    await models.User.update(payload, { where: { id: userId } });

    // Return refreshed team info
    return await getMyTeamInfo(userId);
  } catch (error) {
    console.error('updateMyTeamInfo error:', error);
    throw new Error(`updateMyTeamInfo error: ${error.message}`);
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

export const getTeamRankings = async () => {
  try {
    // Lấy tất cả users có role TEAM_MANAGER
    const teams = await models.User.findAll({
      where: {
        role: 3, // TEAM_MANAGER
        status: 1,
        deleted: 0
      },
      attributes: ['id', 'username', 'full_name', 'avatar', 'wallet_address', 'description', 'created_date']
    });

    // Tính toán thống kê cho từng đội
    const teamsWithStats = await Promise.all(teams.map(async (user) => {
      // Lấy tất cả participants của user này
      const participants = await models.Participant.findAll({
        where: { user_id: user.id, status: 'APPROVED' },
        attributes: ['id', 'team_name']
      });

      const participantIds = participants.map(p => p.id);
      let wins = 0;
      let losses = 0;
      let draws = 0;
      const teamName = participants[0]?.team_name || user.full_name;

      if (participantIds.length > 0) {
        // Đếm số trận thắng
        wins = await models.Match.count({
          where: {
            status: 'DONE',
            winner_participant_id: { [models.Sequelize.Op.in]: participantIds }
          }
        });

        // Đếm số trận thua
        losses = await models.Match.count({
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

        // Đếm số trận hòa (trận DONE nhưng không có winner)
        draws = await models.Match.count({
          where: {
            status: 'DONE',
            winner_participant_id: null,
            [models.Sequelize.Op.or]: [
              { team_a_participant_id: { [models.Sequelize.Op.in]: participantIds } },
              { team_b_participant_id: { [models.Sequelize.Op.in]: participantIds } }
            ]
          }
        });
      }

      return {
        id: user.id,
        name: teamName,
        team_name: teamName,
        username: user.username,
        logo_url: user.avatar,
        avatar: user.avatar,
        wallet_address: user.wallet_address,
        description: user.description || `Đội ${teamName}`,
        wins: wins,
        losses: losses,
        draws: draws,
        total_matches: wins + losses + draws,
        points: wins * 3 + draws * 1, // 3 điểm cho thắng, 1 điểm cho hòa
        created_date: user.created_date
      };
    }));

    // Sắp xếp theo điểm giảm dần, nếu bằng điểm thì xếp theo số trận thắng
    const sortedTeams = teamsWithStats.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.wins - a.wins;
    });

    return { teams: sortedTeams };
  } catch (error) {
    console.error('getTeamRankings error:', error);
    throw new Error(`getTeamRankings error: ${error.message}`);
  }
};
