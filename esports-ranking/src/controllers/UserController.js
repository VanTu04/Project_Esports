const userService = require('../services/UserService');
const { responseSuccess, responseWithError } = require('../response/ResponseSuccess');
const { ErrorCodes } = require('../constant/ErrorCodes');

exports.register = async (req, res, next) => {
  try {
    console.log('req.body', req.body);
    const result = await userService.register(req.body);
    return res.json(responseSuccess(result));
  } catch (error) {
    console.error('register error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_API_BAD_REQUEST, 'Lỗi đăng ký', error.message));
  }
};

exports.login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body);
    return res.json(responseSuccess(result));
  } catch (error) {
    console.error('login error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_API_BAD_REQUEST, 'Lỗi đăng nhập', error.message));
  }
};

exports.home = async (req, res, next) => {
  res.json({ message: 'Welcome to eSports Ranking API!' });
};