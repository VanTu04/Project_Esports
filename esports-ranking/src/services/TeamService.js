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
