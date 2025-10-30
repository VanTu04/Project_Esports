const jwt = require('jsonwebtoken');
const models = require('../models');
const { responseSuccess, responseWithError } = require("../helper/messageResponse");
const { ErrorCodes } = require('../constant/ErrorCodes');

//checkAccessToken
exports.checkAccessToken = async (req, res, next) => {
  try {
    // Kiểm tra header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        responseWithError(
          ErrorCodes.ERROR_CODE_UNAUTHORIZED,
          'Mã thông báo không hợp lệ hoặc thiếu!'
        )
      );
    }

    // Lấy token ra
    const token = authHeader.split(' ')[1];

    // Giải mã token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
    } catch (err) {
      return res.status(401).json(
        responseWithError(
          ErrorCodes.ERROR_CODE_UNAUTHORIZED,
          'Mã thông báo đã hết hạn hoặc không hợp lệ!'
        )
      );
    }

    // Lấy thông tin user từ DB
    const user = await models.User.findOne({
      where: { id: decodedToken.id },
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

    // Gắn user vào request để dùng ở controller khác
    req.user = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      username: user.username,
      role: user.role,
      is_user: true,
    };

    next(); // Quan trọng: gọi next() để middleware kết thúc hợp lệ
  } catch (err) {
    return res.status(401).json(
      responseWithError(
        ErrorCodes.ERROR_CODE_UNAUTHORIZED,
        'Token không hợp lệ hoặc hết hạn!',
        err.message
      )
    );
  }
};

//checkAccessTokenorNot
exports.checkAccessTokenorNot = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return null;
    } else {
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
      if (!decodedToken) {
        return null
      }
      req.user = decodedToken;
      const data = await models.users.findOne({
        where: { id: decodedToken.id, }, attributes: ['id', 'full_name', 'email', 'phone', 'role']
      });
      return data;
    }
  } catch (err) {
    return null;
  }
};


//checkRole
exports.checkRole = (roles = []) => {
  return async (req, res, next) => {
    try {
      // Kiểm tra có token không
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json(
          responseWithError(
            ErrorCodes.ERROR_CODE_UNAUTHORIZED,
            'Mã thông báo không hợp lệ hoặc thiếu!'
          )
        );
      }

      // Lấy token
      const token = authHeader.split(' ')[1];

      // Giải mã token
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
      } catch (err) {
        return res.status(401).json(
          responseWithError(
            ErrorCodes.ERROR_CODE_UNAUTHORIZED,
            'Mã thông báo đã hết hạn hoặc không hợp lệ!'
          )
        );
      }

      // Tìm user tương ứng
      const user = await models.User.findOne({
        where: { id: decodedToken.id },
        attributes: ['id', 'full_name', 'role', 'email', 'username', 'phone'],
      });

      if (!user) {
        return res.status(401).json(
          responseWithError(
            ErrorCodes.ERROR_CODE_UNAUTHORIZED,
            'Không tìm thấy người dùng!'
          )
        );
      }

      req.user = {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        username: user.username,
        role: user.role,
        phone: user.phone,
      };

      // Kiểm tra quyền (nếu có truyền roles)
      if (roles.length > 0 && !roles.includes(req.user.role)) {
        return res.status(403).json(
          responseWithError(
            ErrorCodes.ERROR_CODE_NOT_ALLOWED,
            'Không có quyền truy cập!'
          )
        );
      }

      // Cho phép đi tiếp
      next();
    } catch (err) {
      console.error('checkRole error:', err);
      return res.status(401).json(
        responseWithError(
          ErrorCodes.ERROR_CODE_UNAUTHORIZED,
          'Lỗi xác thực token!',
          err.message
        )
      );
    }
  };
};

//checkRefreshToken
exports.checkRefreshToken = (req, res, next) => {
  try {
    const decodedToken = jwt.verify(req, process.env.JWT_REFRESH_TOKEN_SECRET);
    if (decodedToken) {
      return decodedToken;
    } else {
      res.status(403).json({ message: "RefreshToken không hợp lệ!" });
    }
  } catch (err) {
    return res.status(401).json({
      message: "Mã thông báo được cung cấp không hợp lệ hoặc đã hết hạn!",
      error: err.message
    })
  }
};

//signAccessToken
exports.signAccessToken = (req, res, next) => {
  try {
    const payload = {
      id: req.id,
      full_name: req.full_name,
      username: req.username,
      email: req.email,
      role: req.role
    }
    return jwt.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET, { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES });
  } catch (err) {
    return res.status(401).json({
      error: err
    })
  }
};

//signRefreshToken
exports.signRefreshToken = (req, res, next) => {
  try {
    const payload = {
      id: req.id,
      full_name: req.full_name,
      username: req.username,
      email: req.email,
      role: req.role,
    }
    return jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET, { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES });
  } catch (err) {
    return res.status(401).json({
      error: err
    })
  };
};