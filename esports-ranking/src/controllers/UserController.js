import * as userService from '../services/UserService.js';
import { responseSuccess, responseWithError } from '../response/ResponseSuccess.js';
import { ErrorCodes } from '../constant/ErrorCodes.js';
import dotenv from "dotenv";
dotenv.config();

export const register = async (req, res, next) => {
  try {
    console.log('req.body', req.body);
    const result = await userService.register(req.body);
    return res.json(responseSuccess(result));
  } catch (error) {
    console.error('register error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi đăng ký', error.message));
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body);
    const accessMaxAge = Number(process.env.JWT_ACCESS_TOKEN_EXPIRES) || 1000 * 60 * 30;
    const refreshMaxAge = Number(process.env.JWT_REFRESH_TOKEN_EXPIRES) || 1000 * 60 * 60 * 24 * 7;
    const secure = process.env.COOKIE_SECURE === "true";

    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: secure,
      sameSite: process.env.COOKIE_SAMESITE || "Lax",
      maxAge: accessMaxAge
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: secure,
      sameSite: process.env.COOKIE_SAMESITE || "Lax",
      maxAge: refreshMaxAge
    });

    return res.json(responseSuccess({ user: result.userInfo }));
  } catch (error) {
    console.error('login error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi đăng nhập', error.message));
  }
};

export const logout = (req, res) => {
  // Xoá cookie access + refresh
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  
  return res.json({
    code: 0,
    message: "Logout thành công"
  });
};

export const refreshToken = async (req, res) => {
  try {
    const user = req.user;
    const result = await userService.refreshToken(user);
    const accessMaxAge = Number(process.env.JWT_ACCESS_TOKEN_EXPIRES) || 1000 * 60 * 30;
    const secure = process.env.COOKIE_SECURE === "true";
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: secure,
      sameSite: process.env.COOKIE_SAMESITE || "Lax",
      maxAge: accessMaxAge
    });
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: secure,
      sameSite: process.env.COOKIE_SAMESITE || "Lax",
      maxAge: Number(process.env.JWT_REFRESH_TOKEN_EXPIRES) || 1000 * 60 * 60 * 24 * 7
    });
    return res.json(responseSuccess("Làm mới token thành công"));
  } catch (error) {
    console.error('refreshToken error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi làm mới token', error.message));
  }
};


export const sendOtp = async (req, res, next) => {
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

export const checkOTP = async (req, res, next) => {
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

export const home = async (req, res, next) => {
  res.json({ message: 'Welcome to eSports Ranking API!' });
};

export const forgetPassword = async (req, res, next) => {
  try {
    const result = await userService.forgetPassword(req.body);
    return res.json(responseSuccess(result));
  } catch (error) {
    console.error('forgetPassword error', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi quên mật khẩu', error.message));
  }
};

export const checkExistEmail = async (req, res, next) => {
  try {
    const email = req.body.email;
    if(!email) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Email không được để trống khi kiểm tra'));
    }
    const result = await userService.checkExistEmail(email);
    return res.json(responseSuccess({exists: result}, 'Kiểm tra email thành công'));
  } catch (error) {
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi check email', error.message));
  }
}

export const checkExistUsername = async (req, res, next) => {
  try {
    const username = req.body.username;
    if(!username) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Username không được để trống khi kiểm tra'));
    }
    const result = await userService.checkExistUsername(username);
    return res.json(responseSuccess({exists: result}, 'Kiểm tra email thành công'));
  } catch (error) {
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi check username', error.message));
  }
}

export const createNewAccountByAdmin = async (req, res, next) => {
  try {
    console.log("res:", req);
    const adminId = req.user.id;
    const data = req.body;
    if(!data.username && !data.email) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Username hoặc email không được để trống.'));
    }
    if(data.password != data.confirm_password) {
      return res.json(responseWithError(ErrorCodes.ERROR_REQUEST_DATA_INVALID, 'Mật khẩu xác nhận lại không giống mật khẩu ban đầu'));
    }

    const result = await userService.createAccount(data, adminId);
    return res.json(responseSuccess(result, 'Tạo tài khoản thành công'));
  } catch (error) {
    console.log("lỗi: ", error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi hệ thống', error.message));
  }
}

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await userService.getProfile(userId);
    return res.json(responseSuccess(result, 'Lấy thông tin profile thành công'));
  } catch (error) {
    console.log("lỗi: ", error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi hệ thống', error.message));
  }
}

// Get all users (Admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const params = req.query;
    const users = await userService.getAllUsers(params);
    return res.json(responseSuccess({ users }, 'Lấy danh sách người dùng thành công'));
  } catch (error) {
    console.error('getAllUsers error:', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi lấy danh sách người dùng', error.message));
  }
}

// Update user (Admin only)
export const updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const adminId = req.user.id;
    const data = req.body;

    const result = await userService.updateUser(userId, data, adminId);
    return res.json(responseSuccess(result, 'Cập nhật người dùng thành công'));
  } catch (error) {
    console.error('updateUser error:', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi cập nhật người dùng', error.message));
  }
}

// Delete user (Admin only)
export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const adminId = req.user.id;

    const result = await userService.deleteUser(userId, adminId);
    return res.json(responseSuccess(result, 'Xóa người dùng thành công'));
  } catch (error) {
    console.error('deleteUser error:', error);
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'Lỗi xóa người dùng', error.message));
  }
}

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { full_name, phone } = req.body;

    let avatarUrl = null;
    if (req.file) avatarUrl = `/uploads/${req.file.filename}`;

    const updated = await userService.updateProfile(userId, { full_name, phone, avatar: avatarUrl });

    return res.json({
      success: true,
      message: "Cập nhật thông tin thành công",
      data: updated,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};