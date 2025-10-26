const jwt = require('jsonwebtoken');
const { User, Investor } = require('../models');
const { responseSuccess, responseWithError } = require("../helper/messageResponse");
const { ErrorCodes } = require('../constant/ErrorCodes');

//checkAccessToken
exports.checkAccessToken = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_UNAUTHORIZED, "Mã thông báo được cung cấp không hợp lệ hoặc đã hết hạn!"));
    } else {
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);

      if (!decodedToken) {
        return null
      }
      let user = await models.users.findOne({
        where: {
          id: decodedToken.id,
        },
        attributes: [
          'id',
          'full_name',
          'role',
          'email'
        ]
      });
      user = user ? {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_user: 1
      } : null
      req.user = user;
      next();
    }
  } catch (err) {
    return res.json(responseWithError(ErrorCodes.ERROR_CODE_UNAUTHORIZED, "Mã thông báo được cung cấp không hợp lệ hoặc đã hết hạn!", err.message));
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
      if (!req.headers.authorization) {
        return res.json(responseWithError(ErrorCodes.ERROR_CODE_UNAUTHORIZED, "Mã thông báo được cung cấp không hợp lệ hoặc đã hết hạn!"));
      } else {
        const token = req.headers.authorization.split(" ")[1];
        const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
        if (!decodedToken) {
          return null
        }
        let investors = await models.investors.findOne({
          where: {
            user_id: decodedToken.id,
            status: 1,
            deleted: 0
          },
          attributes: [
            'id',
          ]
        });
        let user = await models.users.findOne({
          where: {
            id: decodedToken.id,
          },
          attributes: [
            'id',
            'full_name',
            'role',
            'email',
            'phone'
          ]
        });
        user = user ? {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          is_user: 1,
          investors_id: investors ? investors.id : null
        } : null
        req.user = user;
      }
      if (roles.length == 0) {
        return next()
      } else {
        if (roles.includes(req.user.role)) {
          return next();
        }
        return res.json(responseWithError(ErrorCodes.ERROR_CODE_NOT_ALLOWED, "Not Allowed!"));
      }
    }
    catch (err) {
      console.log(err);
      return res.json(responseWithError(ErrorCodes.ERROR_CODE_UNAUTHORIZED, "Mã thông báo được cung cấp không hợp lệ hoặc đã hết hạn!", err.message));
    }
  }
}

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