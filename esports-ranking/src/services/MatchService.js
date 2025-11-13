// File: services/match.service.js
import models from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Lấy tất cả trận đấu (có lọc)
 */
export const findAll = async (query) => {
  const whereCondition = {};
  if (query.tournament_id) {
    whereCondition.tournament_id = query.tournament_id;
  }
  if (query.round_number) {
    whereCondition.round_number = query.round_number;
  }

  const matches = await models.Match.findAll({
    where: whereCondition,
    order: [['id', 'ASC']],
  });
  return matches;
};

/**
 * Tìm 1 trận đấu bằng ID
 */
export const findMatchById = async (match_id) => {
  const match = await models.Match.findByPk(match_id);
  return match;
};

/**
 * Cập nhật Lịch thi đấu
 */
export const scheduleTime = async (match, new_time) => {
  await match.update({
    match_time: new_time
  });
  return true;
};

/**
 * Cập nhật Kết quả (Điểm)
 */
export const updateResult = async (match, winner_id) => {
  await match.update({
    winner_participant_id: winner_id,
    status: 'COMPLETED'
  });
  return true;
};