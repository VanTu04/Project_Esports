const gameService = require('../services/GameService');
const { responseSuccess, responseWithError } = require('../response/ResponseSuccess');
const { ErrorCodes } = require('../constant/ErrorCodes');

exports.getAllGames = async (req, res) => {
  try {
    const { status } = req.query;
    const result = await gameService.getAllGame(status);
    return res.json(responseSuccess(result, 'Lấy danh sách game thành công'));
  } catch (error) {
    console.error('getAllGames error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

exports.getGameById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await gameService.getGameById(id);
    return res.json(responseSuccess(result, 'Lấy game thành công'));
  } catch (error) {
    console.error('getGameById error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

exports.createGame = async (req, res) => {
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

exports.updateGame = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    if (!data.game_name) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Tên game không được để trống'));
    }
    console.log('id', id);
    const existingGame = await gameService.getGameById(id);
    if (!existingGame) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_DATA_NOT_EXIST, 'Game không tồn tại'));
    }
    console.log('existingGame', existingGame);
    const result = await gameService.updateGame(existingGame, data);
    if(result === true) {
      return res.json(responseSuccess(result, 'Cập nhật game thành công'));
    } else {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Cập nhật game thất bại'));
    }
  } catch (error) {
    console.error('updateGame error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, error.message));
  }
};

exports.deleteGame = async (req, res) => {
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