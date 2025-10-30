const { where } = require('sequelize');
const models = require('../models');

exports.createGame = async (data) => {
  const game = await models.Game.create({
    game_name: data.game_name,
    description: data.description,
    status: data.status || 'ACTIVE'
  });
  return game;
}

exports.getGameById = async (id) => {
  const game = await models.Game.findByPk(id);
  if (!game) throw new Error('Không tìm thấy game');
  return game;
};

exports.getGameByName = async (name) => {
  const existing = await models.Game.findOne({ where: { game_name: name } });
  return existing;
};

exports.updateGame = async (game, data) => {
  await game.update({
    game_name: data.game_name || game.game_name,
    description: data.description || game.description,
    status: data.status || game.status,
  });
  return true;
};

exports.deleteGame = async (game) => {
  await game.update({ status: "INACTIVE" });
  return true;
};

exports.getAllGame = async (status) => {
  const whereCondition = {};

  console.log('status', status);
  if (status !== undefined && status !== null && status !== '') {
    whereCondition.status = status;
  }

  const games = await models.Game.findAll({
    where: whereCondition,
    order: [['created_date', 'DESC']],
    attributes: ['id', 'game_name', 'description', 'status']
  });
  return games;
}