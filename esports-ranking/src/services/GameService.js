import { where } from 'sequelize';
import models from '../models/index.js';

export const createGame = async (data) => {
  const game = await models.Game.create({
    game_name: data.game_name,
    description: data.description,
    status: data.status || 'ACTIVE'
  });
  return game;
};

export const getGameById = async (id) => {
  const game = await models.Game.findByPk(id);
  if (!game) throw new Error('Không tìm thấy game');
  return game;
};

export const getGameByName = async (name) => {
  const existing = await models.Game.findOne({ where: { game_name: name } });
  return existing;
};

export const updateGame = async (game, data) => {
  await game.update({
    game_name: data.game_name || game.game_name,
    description: data.description || game.description,
    status: data.status || game.status,
  });
  return true;
};

export const deleteGame = async (game) => {
  await game.update({ status: 'INACTIVE' });
  return true;
};

export const getAllGame = async (status) => {
  const whereCondition = {};

  if (status !== undefined && status !== null && status !== '') {
    whereCondition.status = status;
  }

  const games = await models.Game.findAll({
    where: whereCondition,
    order: [['created_date', 'DESC']],
    attributes: ['id', 'game_name', 'description', 'status']
  });

  return games;
};
