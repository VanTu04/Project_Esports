import * as teamService from '../services/TeamService.js';
import { responseSuccess, responseWithError } from '../response/ResponseSuccess.js';
import { ErrorCodes } from '../constant/ErrorCodes.js';

export const getAllTeams = async (req, res) => {
  try {
    const params = req.query;
    const result = await teamService.getAllTeams(params);
    return res.json(responseSuccess(result, 'Lấy danh sách đội tuyển thành công'));
  } catch (error) {
    console.error('getAllTeams error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await teamService.getTeamById(id);
    return res.json(responseSuccess(result, 'Lấy thông tin đội tuyển thành công'));
  } catch (error) {
    console.error('getTeamById error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const updateTeamWallet = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!data.wallet_address) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Địa chỉ ví không được để trống'));
    }

    const existingTeam = await teamService.getTeamById(id);
    if (!existingTeam) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Đội tuyển không tồn tại'));
    }

    const result = await teamService.linkWallet(existingTeam.id, data.wallet_address);

    if (result === true) {
      return res.json(responseSuccess(result, 'Cập nhật ví thành công'));
    } else {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Cập nhật ví thất bại'));
    }
  } catch (error) {
    console.error('updateTeamWallet error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

export const getTopTeamsByWins = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const result = await teamService.getTopTeamsByWins(limit);
    return res.json(responseSuccess(result, 'Lấy top đội tuyển thành công'));
  } catch (error) {
    console.error('getTopTeamsByWins error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

