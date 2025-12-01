import * as gameService from '../services/GameService.js';
import { responseSuccess, responseWithError } from '../response/ResponseSuccess.js';
import { ErrorCodes } from '../constant/ErrorCodes.js';

/**
 * Get all games (with optional filters)
 * Query params: status (ACTIVE/INACTIVE), search
 */
export const getAllGames = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (search) filters.search = search;
    
    const result = await gameService.getAllGame(filters);
    return res.json(responseSuccess(result, 'Lấy danh sách game thành công'));
  } catch (error) {
    console.error('getAllGames error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

/**
 * Get only ACTIVE games (for use in select boxes)
 */
export const getActiveGames = async (req, res) => {
  try {
    const result = await gameService.getActiveGames();
    return res.json(responseSuccess(result, 'Lấy danh sách game đang hoạt động thành công'));
  } catch (error) {
    console.error('getActiveGames error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const getGameById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await gameService.getGameById(id);
    return res.json(responseSuccess(result, 'Lấy game thành công'));
  } catch (error) {
    console.error('getGameById error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const createGame = async (req, res) => {
  try {
    const data = req.body;
    if (!data.game_name) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Tên game không được để trống'));
    }

    const existingGame = await gameService.getGameByName(data.game_name);
    if (existingGame) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_EXIST, 'Game đã tồn tại'));
    }

    const result = await gameService.createGame(data);
    return res.json(responseSuccess(result, 'Tạo game thành công'));
  } catch (error) {
    console.error('createGame error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const updateGame = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!data.game_name) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Tên game không được để trống'));
    }

    const existingGame = await gameService.getGameById(id);
    if (!existingGame) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Game không tồn tại'));
    }

    const result = await gameService.updateGame(existingGame, data);
    if (result === true) {
      return res.json(responseSuccess(result, 'Cập nhật game thành công'));
    } else {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Cập nhật game thất bại'));
    }
  } catch (error) {
    console.error('updateGame error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const deleteGame = async (req, res) => {
  try {
    const { id } = req.params;
    const existingGame = await gameService.getGameById(id);

    if (!existingGame) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Game không tồn tại'));
    }

    const result = await gameService.deleteGame(existingGame);
    return res.json(responseSuccess(result, 'Xóa game thành công'));
  } catch (error) {
    console.error('deleteGame error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};
