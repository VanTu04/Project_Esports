'use strict';
import models from '../models/index.js';

/**
 * Tạo season mới
 * @param {object} seasonData - Dữ liệu season {gameId, seasonName, description, start_date, end_date, status}
 * @returns {Promise<Season>}
 */
export const createSeason = async (seasonData) => {
  try {
    const { gameId, seasonName, description, start_date, end_date, status } = seasonData;
    
    const game = await models.Game.findByPk(gameId);
    if (!game) throw new Error('Game not found');

    const season = await models.Season.create({
      game_id: gameId,
      season_name: seasonName,
      description: description || null,
      start_date: start_date || null,
      end_date: end_date || null,
      status: status || 'PREPARING'
    });

    return season;
  } catch (error) {
    throw new Error(`createSeason error: ${error.message}`);
  }
};

/**
 * Lấy tất cả season
 * @returns {Promise<Season[]>}
 */
export const getAllSeasons = async () => {
  try {
    return models.Season.findAll({
      where: { deleted: 0 },
      include: [{ model: models.Game, as: 'game' }]
    });
  } catch (error) {
    throw new Error(`getAllSeasons error: ${error.message}`);
  }
};

/**
 * Lấy season theo ID
 * @param {number} id
 * @returns {Promise<Season>}
 */
export const getSeasonById = async (id) => {
  try {
    const season = await models.Season.findByPk(id, {
      include: [{ model: models.Game, as: 'game' }]
    });
    if (!season) throw new Error('Season not found');
    return season;
  } catch (error) {
    throw new Error(`getSeasonById error: ${error.message}`);
  }
};

/**
 * Cập nhật season
 * @param {number} id
 * @param {object} data
 * @returns {Promise<Season>}
 */
export const updateSeason = async (id, data) => {
  try {
    const season = await models.Season.findByPk(id);
    if (!season) throw new Error('Season not found');

    return season.update(data);
  } catch (error) {
    throw new Error(`updateSeason error: ${error.message}`);
  }
};

/**
 * Xóa season (soft delete)
 * @param {number} id
 * @returns {Promise<Season>}
 */
export const deleteSeason = async (id) => {
  try {
    const season = await models.Season.findByPk(id);
    if (!season) throw new Error('Season not found');

    return season.update({ deleted: 1 });
  } catch (error) {
    throw new Error(`deleteSeason error: ${error.message}`);
  }
};

/**
 * Lấy danh sách mùa giải theo game
 * @param {number} gameId
 * @returns {Promise<Season[]>}
 */
export const getSeasonsByGameId = async (gameId) => {
  try {
    return models.Season.findAll({
      where: { game_id: gameId, deleted: 0 },
      include: [{ model: models.Game, as: 'game' }]
    });
  } catch (error) {
    throw new Error(`getSeasonsByGameId error: ${error.message}`);
  }
};
