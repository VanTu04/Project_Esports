import * as favoriteTeamService from '../services/FavoriteTeamService.js';
import { responseSuccess, responseWithError } from '../response/ResponseSuccess.js';
import { ErrorCodes } from '../constant/ErrorCodes.js';

// Add team to favorites
export const addFavoriteTeam = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { team_id } = req.body;

    if (!team_id) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Team ID không được để trống'));
    }

    const result = await favoriteTeamService.addFavoriteTeam(userId, team_id);
    return res.json(responseSuccess(result, result.message));
  } catch (error) {
    console.error('addFavoriteTeam error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi thêm đội yêu thích', error.message));
  }
};

// Remove team from favorites
export const removeFavoriteTeam = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { team_id } = req.params;

    if (!team_id) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Team ID không được để trống'));
    }

    const result = await favoriteTeamService.removeFavoriteTeam(userId, parseInt(team_id));
    return res.json(responseSuccess(result, result.message));
  } catch (error) {
    console.error('removeFavoriteTeam error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi xóa đội yêu thích', error.message));
  }
};

// Get all favorite teams
export const getFavoriteTeams = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await favoriteTeamService.getFavoriteTeams(userId);
    return res.json(responseSuccess(result, 'Lấy danh sách đội yêu thích thành công'));
  } catch (error) {
    console.error('getFavoriteTeams error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi lấy danh sách đội yêu thích', error.message));
  }
};

// Check if team is favorited
export const checkFavoriteTeam = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { team_id } = req.params;

    if (!team_id) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Team ID không được để trống'));
    }

    const result = await favoriteTeamService.isFavoriteTeam(userId, parseInt(team_id));
    return res.json(responseSuccess(result, 'Kiểm tra thành công'));
  } catch (error) {
    console.error('checkFavoriteTeam error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi kiểm tra đội yêu thích', error.message));
  }
};

// Get favorite status for multiple teams
export const getFavoriteStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { team_ids } = req.body;

    if (!team_ids || !Array.isArray(team_ids)) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Team IDs phải là một mảng'));
    }

    const result = await favoriteTeamService.getFavoriteStatus(userId, team_ids);
    return res.json(responseSuccess(result, 'Lấy trạng thái thành công'));
  } catch (error) {
    console.error('getFavoriteStatus error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi lấy trạng thái đội yêu thích', error.message));
  }
};

// Get followers (users who favorited a specific team)
export const getFollowers = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Team ID không được để trống'));
    const result = await favoriteTeamService.getFollowersOfTeam(parseInt(id));
    return res.json(responseSuccess(result, 'Lấy danh sách followers thành công'));
  } catch (error) {
    console.error('getFollowers error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi lấy followers', error.message));
  }
};

// Get following (teams followed by a specific user/team)
export const getFollowing = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'User ID không được để trống'));
    const result = await favoriteTeamService.getFollowingByUser(parseInt(id));
    return res.json(responseSuccess(result, 'Lấy danh sách following thành công'));
  } catch (error) {
    console.error('getFollowing error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi lấy following', error.message));
  }
};
