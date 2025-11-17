// src/middlewares/jwt_token.js
import jwt from 'jsonwebtoken';
import models from '../models/index.js';
import { responseWithError } from '../helper/MessageResponse.js';
import { ErrorCodes } from '../constant/ErrorCodes.js';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRES = process.env.JWT_ACCESS_TOKEN_EXPIRES || '15m';
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_TOKEN_EXPIRES || '7d';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true'; // true trên prod

// ===================== Sign Token ===================== //
export const signAccessToken = (user) => {
  const payload = {
    id: user.id,
    full_name: user.full_name,
    username: user.username,
    email: user.email,
    role: user.role
  };
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
};

export const signRefreshToken = (user) => {
  const payload = {
    id: user.id,
    full_name: user.full_name,
    username: user.username,
    email: user.email,
    role: user.role
  };
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });
};

// ===================== Middleware ===================== //

// Kiểm tra access token từ cookie
export const checkAccessToken = async (req, res, next) => {
  try {
    console.log("req cookies:", req.cookies);
    const token = req.cookies?.accessToken || req.headers?.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json(
        responseWithError(ErrorCodes.ERROR_CODE_UNAUTHORIZED, 'Access token không hợp lệ hoặc thiếu!')
      );
    }
    console.log('Token found:', token);
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    console.log('Decoded token:', decoded);
    const user = await models.User.findOne({
      where: { id: decoded.id, deleted: 0 },
      attributes: ['id', 'full_name', 'username', 'email', 'role']
    });

    if (!user) {
      return res.status(401).json(
        responseWithError(ErrorCodes.ERROR_CODE_UNAUTHORIZED, 'Không tìm thấy người dùng!')
      );
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json(
      responseWithError(ErrorCodes.ERROR_CODE_UNAUTHORIZED, 'Access token không hợp lệ hoặc hết hạn!', err.message)
    );
  }
};

// Kiểm tra refresh token từ cookie
export const checkRefreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Refresh token không tồn tại!" });
    }

    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
    const user = await models.User.findOne({
      where: { id: decoded.id, deleted: 0 },
      attributes: ['id', 'full_name', 'username', 'email', 'role']
    });

    if (!user) {
      return res.status(401).json({ message: "Người dùng không tồn tại!" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Refresh token không hợp lệ hoặc hết hạn!", error: err.message });
  }
};

// Kiểm tra quyền
export const checkRole = (roles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.cookies?.accessToken || req.headers?.authorization?.split(' ')[1];
      console.log('Token found:', token);
      if (!token) {
        return res.status(401).json({ message: "Access token không tồn tại!" });
      }
      console.log('Token found1:', token);
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

      console.log('Decoded token:', decoded);
      const user = await models.User.findOne({
        where: { id: decoded.id },
        attributes: ['id', 'full_name', 'role', 'email', 'username'],
      });

      if (!user) {
        return res.status(401).json(
          responseWithError(
            ErrorCodes.ERROR_CODE_UNAUTHORIZED,
            'Không tìm thấy người dùng!'
          )
        );
      }

      if (roles.length > 0 && !roles.includes(user.role)) {
        return res.status(403).json(
          responseWithError(ErrorCodes.ERROR_CODE_NOT_ALLOWED, 'Không có quyền truy cập!')
        );
      }

      req.user = user;
      next();
    } catch (err) {
      console.error('checkRole error:', err);
      return res.status(401).json(
        responseWithError(ErrorCodes.ERROR_CODE_UNAUTHORIZED, 'Lỗi xác thực!', err.message)
      );
    }
  };
};