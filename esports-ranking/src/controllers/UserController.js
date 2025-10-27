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
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi đăng ký', error.message));
  }
};

exports.login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body);
    return res.json(responseSuccess(result));
  } catch (error) {
    console.error('login error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi đăng nhập', error.message));
  }
};

exports.sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Email không được để trống'));
    }
    const user = await userService.getByEmail(email);
    if(!user) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Email không tồn tại trong hệ thống'));
    }
    if(user.status !== 1 || user.deleted === 1) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Tài khoản không khả dụng'));
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // cập nhật vào database
    await userService.updateOTP(user.id, otp, expiresAt);

    // gửi mail
    const result = await userService.sendOtp(email, otp);

    if(result) {
      return res.json(responseSuccess({data: 'Gửi email xác thực thành công'}));
    } else {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_API_BAD_REQUEST, 'Gửi email xác thực thất bại'));
    }
  } catch (error) {
    console.error('sendVerify error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi gửi email xác thực', error.message));
  }
};

exports.checkOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_EMAIL_DONT_EXIST, 'Email và OTP không được để trống'));
    }
    const user = await userService.getByEmail(email);
    if(!user) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_EMAIL_DONT_EXIST, 'Email không tồn tại trong hệ thống'));
    }
    if(user.otp !== otp) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_OTP, 'OTP không đúng'));
    }
    const now = new Date();
    if(user.otp_expires_at < now) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'OTP này đã hết hạn!'));
    }
    await userService.updateOTP(user.id, null, null);
    return res.json(responseSuccess({data: 'Xác thực OTP thành công'}));
  } catch (error) {
    console.error('checkOTP error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi xác thực OTP', error.message));
  }
};

exports.home = async (req, res, next) => {
  res.json({ message: 'Welcome to eSports Ranking API!' });
};

exports.forgetPassword = async (req, res, next) => {
  try {
    const result = await userService.forgetPassword(req.body);
    return res.json(responseSuccess(result));
  } catch (error) {
    console.error('forgetPassword error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi quên mật khẩu', error.message));
  }
};