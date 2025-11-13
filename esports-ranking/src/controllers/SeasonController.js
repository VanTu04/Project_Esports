import * as seasonService from '../services/SeasonService.js';
import { responseSuccess, responseWithError } from '../response/ResponseSuccess.js';
import { ErrorCodes } from '../constant/ErrorCodes.js';

export const getAllSeasons = async (req, res) => {
  try {
    const result = await seasonService.getAllSeasons();
    return res.json(responseSuccess(result, 'Lấy danh sách mùa giải thành công'));
  } catch (error) {
    console.error('getAllSeasons error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const getSeasonById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await seasonService.getSeasonById(id);
    return res.json(responseSuccess(result, 'Lấy mùa giải thành công'));
  } catch (error) {
    console.error('getSeasonById error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const createSeason = async (req, res) => {
  try {
    const { gameId, seasonName, description, start_date, end_date, status } = req.body;

    if (!gameId || !seasonName) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Game hoặc tên mùa giải không được để trống'));
    }

    const seasonData = {
      gameId,
      seasonName,
      description: description || null,
      start_date: start_date || null,
      end_date: end_date || null,
      status: status || 'PREPARING'
    };

    const result = await seasonService.createSeason(seasonData);
    return res.json(responseSuccess(result, 'Tạo mùa giải thành công'));
  } catch (error) {
    console.error('createSeason error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const updateSeason = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingSeason = await seasonService.getSeasonById(id);
    if (!existingSeason) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Mùa giải không tồn tại'));
    }

    const result = await seasonService.updateSeason(id, data);
    return res.json(responseSuccess(result, 'Cập nhật mùa giải thành công'));
  } catch (error) {
    console.error('updateSeason error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const deleteSeason = async (req, res) => {
  try {
    const { id } = req.params;

    const existingSeason = await seasonService.getSeasonById(id);
    if (!existingSeason) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Mùa giải không tồn tại'));
    }

    const result = await seasonService.deleteSeason(id);
    return res.json(responseSuccess(result, 'Xóa mùa giải thành công'));
  } catch (error) {
    console.error('deleteSeason error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const getSeasonsByGameId = async (req, res) => {
  try {
    const { gameId } = req.params;
    if (!gameId) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'gameId không được để trống'));
    }

    const result = await seasonService.getSeasonsByGameId(gameId);
    return res.json(responseSuccess(result, 'Lấy danh sách mùa giải theo game thành công'));
  } catch (error) {
    console.error('getSeasonsByGameId error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};


