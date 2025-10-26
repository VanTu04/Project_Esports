const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const models = require('../models');
const jwt_token = require('../middlewares/jwt_token');

exports.register = async (data) => {

  if (!data.email || !data.username || !data.password || !data.full_name) {
    throw new Error('Thiếu thông tin bắt buộc: email, username, full_name, password');
  }

  // Kiểm tra trùng email
  const existingUser = await models.User.findOne({
    where: {
      email: data.email,
      status: 1,
      deleted: 0
    }
  });

  if (existingUser) {
    throw new Error('Email đã tồn tại, vui lòng dùng email khác.');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const newUser = await models.User.create({
    email: data.email,
    username: data.username,
    full_name: data.full_name,
    password: hashedPassword,
    role: data.role ?? 1,
    status: 1,
    deleted: 0
  });

  return { user: {
    id: newUser.id,
    email: newUser.email,
    username: newUser.username,
    full_name: newUser.full_name,
    role: newUser.role,
    status: newUser.status,
    deleted: newUser.deleted,
  } };
};

exports.login = async (data) => {
  if (!data.account || !data.password) {
    throw new Error('Thiếu thông tin đăng nhập!');
  }

  // Tìm user theo email hoặc username
  const user = await models.User.findOne({
    where: {
      [Op.or]: [
        { email: data.account },
        { username: data.account }
      ],
      status: 1,
      deleted: 0
    }
  });

  if (!user) {
    throw new Error('Tài khoản không tồn tại!');
  }

  // So sánh mật khẩu
  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) {
    throw new Error('Mật khẩu không đúng!');
  }

  const accessToken = jwt_token.signAccessToken(user);
  const refreshToken = jwt_token.signRefreshToken(user);

  return { accessToken, refreshToken };
};
