import models from '../models/index.js';
import { Op } from 'sequelize';

// Add team to favorites
export const addFavoriteTeam = async (userId, teamId) => {
  try {
    // Check if already favorited
    const existing = await models.FavoriteTeam.findOne({
      where: { user_id: userId, team_id: teamId }
    });

    if (existing) {
      return { success: true, message: 'Đội đã có trong danh sách yêu thích' };
    }

    // Check if team (user with role=3) exists
    const team = await models.User.findOne({
      where: { 
        id: teamId,
        role: 3, // TEAM_MANAGER
        status: 1,
        deleted: 0
      }
    });
    
    if (!team) {
      throw new Error('Đội không tồn tại');
    }

    await models.FavoriteTeam.create({
      user_id: userId,
      team_id: teamId,
      created_date: new Date()
    });

    return { success: true, message: 'Đã thêm vào danh sách yêu thích' };
  } catch (error) {
    console.error('addFavoriteTeam error:', error);
    throw error;
  }
};

// Remove team from favorites
export const removeFavoriteTeam = async (userId, teamId) => {
  try {
    const result = await models.FavoriteTeam.destroy({
      where: { user_id: userId, team_id: teamId }
    });

    if (result === 0) {
      throw new Error('Không tìm thấy trong danh sách yêu thích');
    }

    return { success: true, message: 'Đã xóa khỏi danh sách yêu thích' };
  } catch (error) {
    console.error('removeFavoriteTeam error:', error);
    throw error;
  }
};

// Get all favorite teams of a user
export const getFavoriteTeams = async (userId) => {
  try {
    const favorites = await models.FavoriteTeam.findAll({
      where: { user_id: userId },
      attributes: ['team_id', 'created_date'],
      order: [['created_date', 'DESC']]
    });

    // Get team details from User table (users with role=3)
    const teamIds = favorites.map(fav => fav.team_id);
    
    if (teamIds.length === 0) {
      return { teams: [] };
    }

    const teams = await models.User.findAll({
      where: {
        id: { [Op.in]: teamIds },
        role: 3, // TEAM_MANAGER
        status: 1,
        deleted: 0
      },
      attributes: ['id', 'username', 'full_name', 'email', 'avatar', 'phone', 'wallet_address']
    });

    return { teams };
  } catch (error) {
    console.error('getFavoriteTeams error:', error);
    throw error;
  }
};

// Check if team is favorited by user
export const isFavoriteTeam = async (userId, teamId) => {
  try {
    const favorite = await models.FavoriteTeam.findOne({
      where: { user_id: userId, team_id: teamId }
    });

    return { isFavorite: !!favorite };
  } catch (error) {
    console.error('isFavoriteTeam error:', error);
    throw error;
  }
};

// Get favorite status for multiple teams
export const getFavoriteStatus = async (userId, teamIds) => {
  try {
    const favorites = await models.FavoriteTeam.findAll({
      where: {
        user_id: userId,
        team_id: { [Op.in]: teamIds }
      },
      attributes: ['team_id']
    });

    const favoriteTeamIds = favorites.map(fav => fav.team_id);
    return { favoriteTeamIds };
  } catch (error) {
    console.error('getFavoriteStatus error:', error);
    throw error;
  }
};

// Get users who favorited a given team (followers)
export const getFollowersOfTeam = async (teamId) => {
  try {
    const rows = await models.FavoriteTeam.findAll({
      where: { team_id: teamId },
      include: [{ model: models.User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar', 'email', 'role'] }],
      order: [['created_date', 'DESC']]
    });

    const users = rows.map(r => r.user).filter(Boolean);
    return { users };
  } catch (error) {
    console.error('getFollowersOfTeam error:', error);
    throw error;
  }
};

// Get teams followed by a given user (following)
export const getFollowingByUser = async (userId) => {
  try {
    const rows = await models.FavoriteTeam.findAll({
      where: { user_id: userId },
      include: [{ model: models.User, as: 'teamUser', attributes: ['id', 'username', 'full_name', 'avatar', 'email', 'role'] }],
      order: [['created_date', 'DESC']]
    });

    const teams = rows.map(r => r.teamUser).filter(Boolean);
    return { teams };
  } catch (error) {
    console.error('getFollowingByUser error:', error);
    throw error;
  }
};
