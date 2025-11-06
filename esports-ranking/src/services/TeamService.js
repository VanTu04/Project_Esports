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
