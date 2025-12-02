import { where } from 'sequelize';
import models from '../models/index.js';

/**
 * Get all games (both ACTIVE and INACTIVE, excluding deleted)
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>}
 */
export const getAllGame = async (filters = {}) => {
  try {
    const whereCondition = { deleted: false };

    // Apply status filter if provided
    if (filters.status !== undefined && filters.status !== null && filters.status !== '') {
      whereCondition.status = filters.status;
    }

    // Apply search filter if provided
    if (filters.search) {
      whereCondition.game_name = {
        [models.Sequelize.Op.like]: `%${filters.search}%`
      };
    }

    const games = await models.Game.findAll({
      where: whereCondition,
      order: [['created_date', 'DESC']],
      attributes: ['id', 'game_name', 'description', 'status', 'created_date', 'updated_date']
    });

    return games;
  } catch (error) {
    console.error('getAllGame error:', error);
    throw error;
  }
};

/**
 * Get only ACTIVE games (for select boxes in forms)
 * @returns {Promise<Array>}
 */
export const getActiveGames = async () => {
  try {
    const games = await models.Game.findAll({
      where: {
        status: 'ACTIVE',
        deleted: false
      },
      order: [['game_name', 'ASC']],
      attributes: ['id', 'game_name', 'description']
    });

    return games;
  } catch (error) {
    console.error('getActiveGames error:', error);
    throw error;
  }
};

/**
 * Get game by ID
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const getGameById = async (id) => {
  const game = await models.Game.findOne({
    where: {
      id: id,
      deleted: false
    }
  });
  if (!game) throw new Error('Không tìm thấy game');
  return game;
};

/**
 * Get game by name
 * @param {string} name
 * @returns {Promise<Object>}
 */
export const getGameByName = async (name) => {
  const existing = await models.Game.findOne({ 
    where: { 
      game_name: name,
      deleted: false
    } 
  });
  return existing;
};

/**
 * Create a new game
 * @param {Object} data - { game_name, description, status }
 * @returns {Promise<Object>}
 */
export const createGame = async (data) => {
  try {
    // Check if game name already exists
    const existingGame = await getGameByName(data.game_name);
    if (existingGame) {
      throw new Error('Tên game đã tồn tại trong hệ thống');
    }

    const game = await models.Game.create({
      game_name: data.game_name,
      description: data.description || null,
      status: data.status || 'INACTIVE', // Default to INACTIVE when created
      deleted: false
    });

    return game;
  } catch (error) {
    console.error('createGame error:', error);
    throw error;
  }
};

/**
 * Update a game
 * @param {Object} game - Game instance
 * @param {Object} data - { game_name, description, status }
 * @returns {Promise<boolean>}
 */
export const updateGame = async (game, data) => {
  try {
    // Check if new game name conflicts with another game
    if (data.game_name && data.game_name !== game.game_name) {
      const existingGame = await models.Game.findOne({
        where: {
          game_name: data.game_name,
          deleted: false,
          id: { [models.Sequelize.Op.ne]: game.id }
        }
      });

      if (existingGame) {
        throw new Error('Tên game đã tồn tại trong hệ thống');
      }
    }

    await game.update({
      game_name: data.game_name || game.game_name,
      description: data.description !== undefined ? data.description : game.description,
      status: data.status || game.status,
    });
    return true;
  } catch (error) {
    console.error('updateGame error:', error);
    throw error;
  }
};

/**
 * Delete a game (soft delete, only if status = INACTIVE)
 * @param {Object} game - Game instance
 * @returns {Promise<boolean>}
 */
export const deleteGame = async (game) => {
  try {
    // Check if game is ACTIVE - cannot delete active games
    if (game.status === 'ACTIVE') {
      throw new Error('Không thể xóa game đang ở trạng thái ACTIVE. Vui lòng chuyển sang INACTIVE trước khi xóa.');
    }

    // Check if game is being used in any active tournaments
    const tournamentsCount = await models.Tournament.count({
      where: {
        game_id: game.id,
        deleted: 0
      }
    });

    if (tournamentsCount > 0) {
      throw new Error(`Không thể xóa game vì đang có ${tournamentsCount} giải đấu sử dụng game này`);
    }

    // Soft delete
    await game.update({ deleted: true });
    return true;
  } catch (error) {
    console.error('deleteGame error:', error);
    throw error;
  }
};
