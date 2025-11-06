import * as teamService from '../services/TeamService.js';
import { responseSuccess, responseWithError } from '../response/ResponseSuccess.js';
import { ErrorCodes } from '../constant/ErrorCodes.js';

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
